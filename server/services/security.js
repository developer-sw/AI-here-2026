import crypto from 'node:crypto'

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

export function requireHeader(req, name, message = `${name} 헤더가 필요합니다.`) {
  const value = req.get(name)?.trim()
  if (!value) throw new HttpError(401, message)
  return value
}

export function hashOwnerKey(ownerKey, pepper = '') {
  return crypto
    .createHash('sha256')
    .update(`${pepper}\u0000${ownerKey}`)
    .digest('hex')
}

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

export function createRateLimiter({ windowMs = 60_000, max = 180 } = {}) {
  const buckets = new Map()
  let lastCleanup = Date.now()

  return function rateLimit(req, res, next) {
    const now = Date.now()
    if (now - lastCleanup > windowMs) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key)
      }
      lastCleanup = now
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const current = buckets.get(key)
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current

    bucket.count += 1
    buckets.set(key, bucket)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)))
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

    if (bucket.count > max) {
      return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' })
    }
    next()
  }
}
