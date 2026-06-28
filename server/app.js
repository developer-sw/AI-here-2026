import express from 'express'
import multer from 'multer'
import { parse as parseCsv } from 'csv-parse/sync'
import crypto from 'node:crypto'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JsonListingStore } from './services/store.js'
import { geocodeAddress } from './services/geocode.js'
import { recommend, simulate, compare, marketAnalysis, chat } from './services/ai.js'
import { localNearbyCategoryCounts } from './services/metrics.js'
import { searchNaverNews } from './services/news.js'
import { fetchLhCommercialNotices } from './services/lh.js'
import {
  normalizeStoredListing,
  parseListingInput,
  parseReviewInput,
  publicListing,
  inferTradeType,
} from './services/validation.js'
import {
  createRateLimiter,
  hashOwnerKey,
  HttpError,
  requireHeader,
  safeEqual,
} from './services/security.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const TRADE_ALIASES = { sale: 'SALE', jeonse: 'JEONSE', wolse: 'MONTHLY' }

function allowedOrigins(env) {
  return new Set((env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean))
}

function applyCors(allowed) {
  return (req, res, next) => {
    const origin = req.get('Origin')
    if (origin && allowed.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Owner-Key, X-Admin-Key')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(origin && allowed.has(origin) ? 204 : 403)
    next()
  }
}

function ownerContext(req, env, required = true) {
  const key = required
    ? requireHeader(req, 'X-Owner-Key', '방문자 식별 키가 필요합니다.')
    : req.get('X-Owner-Key')?.trim()
  return key ? { key, hash: hashOwnerKey(key, env.OWNER_KEY_PEPPER || '') } : null
}

function owns(row, owner) {
  if (!owner) return false
  if (row._ownerHash && safeEqual(row._ownerHash, owner.hash)) return true
  return typeof row.ownerKey === 'string' && safeEqual(row.ownerKey, owner.key)
}

function migrateOwner(row, owner) {
  row._ownerHash = owner.hash
  delete row.ownerKey
}

function listingCode(row, level) {
  if (level === 'sig') return `sig:${encodeURIComponent(row.sigungu || '서산시')}`
  const parent = row.sigungu || '서산시'
  const name = row.dong || row.region || '기타'
  return `emd:${encodeURIComponent(parent)}:${encodeURIComponent(name)}`
}

function listingRegionName(row, level) {
  return level === 'sig' ? (row.sigungu || '서산시') : (row.dong || row.region || '기타')
}

function mapRows(rawRows, query = {}) {
  let rows = rawRows.map(normalizeStoredListing)
  if (String(query.onlyWithCoords) === 'true') {
    rows = rows.filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng))
  }
  const keyword = String(query.keyword || '').trim().toLowerCase()
  if (keyword) {
    rows = rows.filter((row) => [row.title, row.address, row.region, row.dong, row.sigungu]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(keyword))
  }
  const theme = String(query.theme || '').trim()
  if (theme) rows = rows.filter((row) => row.theme.some((value) => value.includes(theme)))
  return rows
}

function regionGroups(rawRows, level, query = {}) {
  const parentCode = String(query.parentCode || query.parent || '')
  const groups = new Map()
  for (const row of mapRows(rawRows, query)) {
    const parent = listingCode(row, 'sig')
    if (level === 'emd' && parentCode && parent !== parentCode) continue
    const code = listingCode(row, level)
    const item = groups.get(code) || {
      code,
      parentCode: level === 'emd' ? parent : undefined,
      name: listingRegionName(row, level),
      level,
      count: 0,
      latTotal: 0,
      lngTotal: 0,
      coordinateCount: 0,
    }
    item.count += 1
    if (Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
      item.latTotal += row.lat
      item.lngTotal += row.lng
      item.coordinateCount += 1
    }
    groups.set(code, item)
  }
  return [...groups.values()].map((item) => ({
    code: item.code,
    parentCode: item.parentCode,
    name: item.name,
    level: item.level,
    count: item.count,
    lat: item.coordinateCount ? item.latTotal / item.coordinateCount : 36.781,
    lng: item.coordinateCount ? item.lngTotal / item.coordinateCount : 126.452,
  }))
}

function parseIds(value) {
  return new Set(String(value || '').split(',').map((id) => id.trim()).filter(Boolean))
}

function filterAndSortListings(rawRows, query) {
  let rows = rawRows.map(normalizeStoredListing)
  const ids = parseIds(query.ids)
  if (ids.size) rows = rows.filter((row) => ids.has(row.id))
  const q = String(query.q || '').trim().toLowerCase()
  if (q) {
    rows = rows.filter((row) => [row.title, row.address, row.region, row.category, ...row.theme]
      .filter(Boolean).join(' ').toLowerCase().includes(q))
  }
  for (const field of ['region', 'category']) {
    const value = String(query[field] || '').trim().toLowerCase()
    if (value) rows = rows.filter((row) => String(row[field] || '').toLowerCase().includes(value))
  }
  const theme = String(query.theme || '').trim().toLowerCase()
  if (theme) rows = rows.filter((row) => row.theme.some((value) => value.toLowerCase().includes(theme)))
  const requestedType = String(query.dealType || query.type || '').toLowerCase()
  if (requestedType && requestedType !== 'all') {
    const type = TRADE_ALIASES[requestedType] || requestedType.toUpperCase()
    rows = rows.filter((row) => row.type === type)
  }
  const sort = String(query.sort || 'newest')
  const price = (row) => row.type === 'MONTHLY' ? (row.rentMonthly ?? 0) : (row.price ?? 0)
  if (sort === 'price') rows.sort((a, b) => price(a) - price(b))
  else if (sort === 'area') rows.sort((a, b) => (b.area ?? 0) - (a.area ?? 0))
  else if (sort === 'popular') rows.sort((a, b) => b._favoriteOwnerHashes.length - a._favoriteOwnerHashes.length)
  else rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  return rows
}

function csvToBody(row) {
  const legacyType = row.type && !['SALE', 'JEONSE', 'MONTHLY', '매매', '전세', '월세'].includes(row.type)
  const type = row.tradeType || (legacyType ? inferTradeType(row) : row.type) || inferTradeType(row)
  return {
    title: row.title,
    description: row.description,
    address: row.address,
    region: row.region,
    category: row.category || (legacyType ? row.type : '기타'),
    type,
    price: type === 'JEONSE' ? (row.price || row.deposit) : row.price,
    deposit: type === 'MONTHLY' ? row.deposit : undefined,
    rentMonthly: type === 'MONTHLY' ? (row.rentMonthly || row.rent) : undefined,
    maintenanceFee: row.maintenanceFee,
    area: row.area,
    lat: row.lat,
    lng: row.lng,
    images: String(row.images || '').split('|').map((value) => value.trim()).filter(Boolean),
    theme: String(row.theme || '').split('|').map((value) => value.trim()).filter(Boolean),
    phone: row.phone,
    availableFrom: row.availableFrom,
  }
}

export function createApp({
  env = process.env,
  dataFile = env.DATA_FILE || path.join(__dirname, 'data', 'listings.json'),
  serveFrontend = env.SERVE_FRONTEND === 'true',
} = {}) {
  const app = express()
  const store = new JsonListingStore(dataFile)
  const allowed = allowedOrigins(env)

  app.disable('x-powered-by')
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
    next()
  })
  app.use(applyCors(allowed))
  app.use(createRateLimiter({ max: Number(env.RATE_LIMIT_PER_MINUTE || 180) }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', asyncRoute(async (req, res) => {
    const rows = await store.load()
    res.json({ ok: true, listings: rows.length })
  }))

  app.get('/api/public/lh-commercial-notices', asyncRoute(async (req, res) => {
    try {
      const result = await fetchLhCommercialNotices({
        env,
        keyword: req.query.q,
        page: req.query.page,
        pageSize: req.query.pageSize,
        regionCode: req.query.regionCode,
      })
      res.json(result)
    } catch (error) {
      console.error('LH Open API request failed:', error)
      res.json({
        available: false,
        status: 'error',
        source: 'lh-open-data',
        items: [],
        total: 0,
        message: 'LH 공고를 불러오지 못했습니다. 자체 등록 매물만 표시합니다.',
      })
    }
  }))

  app.get('/api/listings', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env, false)
    const rows = filterAndSortListings(await store.load(), req.query)
    res.json(rows.map((row) => publicListing(row, { canEdit: owns(row, owner) })))
  }))

  app.get('/api/listings/mine', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const rows = (await store.load()).filter((row) => owns(row, owner))
    res.json({ items: rows.map((row) => publicListing(row, { canEdit: true })) })
  }))

  app.get('/api/listings/:id', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env, false)
    const row = (await store.load()).find((item) => String(item.id) === req.params.id)
    if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
    res.json(publicListing(row, { canEdit: owns(row, owner) }))
  }))

  app.post('/api/listings', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const input = parseListingInput(req.body)
    if (input.address && (!Number.isFinite(input.lat) || !Number.isFinite(input.lng))) {
      const geocoded = await geocodeAddress(input.address).catch(() => null)
      if (geocoded) Object.assign(input, { lat: geocoded.lat, lng: geocoded.lng })
    }
    const now = new Date().toISOString()
    const created = await store.transaction((rows) => {
      const row = {
        ...input,
        id: crypto.randomUUID(),
        _ownerHash: owner.hash,
        _reviews: [],
        _favoriteOwnerHashes: [],
        createdAt: now,
        updatedAt: now,
      }
      rows.push(row)
      return row
    })
    res.status(201).json(publicListing(created, { canEdit: true }))
  }))

  app.put('/api/listings/:id', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const updated = await store.transaction((rows) => {
      const row = rows.find((item) => String(item.id) === req.params.id)
      if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      if (!owns(row, owner)) throw new HttpError(403, '이 매물을 수정할 권한이 없습니다.')
      const current = publicListing(row)
      const input = parseListingInput({ ...current, ...req.body })
      migrateOwner(row, owner)
      Object.assign(row, input, { updatedAt: new Date().toISOString() })
      return row
    })
    res.json(publicListing(updated, { canEdit: true }))
  }))

  app.delete('/api/listings/:id', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    await store.transaction((rows) => {
      const index = rows.findIndex((item) => String(item.id) === req.params.id)
      if (index < 0) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      if (!owns(rows[index], owner)) throw new HttpError(403, '이 매물을 삭제할 권한이 없습니다.')
      rows.splice(index, 1)
    })
    res.json({ ok: true, deleted: req.params.id })
  }))

  app.get('/api/listings/:id/reviews', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env, false)
    const row = (await store.load()).find((item) => String(item.id) === req.params.id)
    if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
    const normalized = normalizeStoredListing(row)
    res.json(normalized._reviews.map((review) => ({
      id: String(review.id),
      text: String(review.text || ''),
      nickname: String(review.nickname || '익명'),
      rating: Number.isFinite(Number(review.rating)) ? Number(review.rating) : undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      canEdit: Boolean(owner && safeEqual(review.ownerHash, owner.hash)),
    })))
  }))

  app.post('/api/listings/:id/reviews', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const input = parseReviewInput(req.body)
    const created = await store.transaction((rows) => {
      const row = rows.find((item) => String(item.id) === req.params.id)
      if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      row._reviews = Array.isArray(row._reviews) ? row._reviews : []
      const review = {
        ...input,
        id: crypto.randomUUID(),
        ownerHash: owner.hash,
        createdAt: new Date().toISOString(),
      }
      row._reviews.unshift(review)
      return review
    })
    const { ownerHash, ...safe } = created
    res.status(201).json({ ...safe, canEdit: true })
  }))

  app.put('/api/listings/:id/reviews/:reviewId', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const input = parseReviewInput(req.body, { partial: true })
    const updated = await store.transaction((rows) => {
      const row = rows.find((item) => String(item.id) === req.params.id)
      if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      const review = (row._reviews || []).find((item) => item.id === req.params.reviewId)
      if (!review) throw new HttpError(404, '리뷰를 찾을 수 없습니다.')
      if (!safeEqual(review.ownerHash, owner.hash)) throw new HttpError(403, '이 리뷰를 수정할 권한이 없습니다.')
      Object.assign(review, input, { updatedAt: new Date().toISOString() })
      return review
    })
    const { ownerHash, ...safe } = updated
    res.json({ ...safe, canEdit: true })
  }))

  app.delete('/api/listings/:id/reviews/:reviewId', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    await store.transaction((rows) => {
      const row = rows.find((item) => String(item.id) === req.params.id)
      if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      const index = (row._reviews || []).findIndex((item) => item.id === req.params.reviewId)
      if (index < 0) throw new HttpError(404, '리뷰를 찾을 수 없습니다.')
      if (!safeEqual(row._reviews[index].ownerHash, owner.hash)) throw new HttpError(403, '이 리뷰를 삭제할 권한이 없습니다.')
      row._reviews.splice(index, 1)
    })
    res.json({ ok: true })
  }))

  app.get('/api/favorites', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const items = (await store.load())
      .filter((row) => (row._favoriteOwnerHashes || []).some((hash) => safeEqual(hash, owner.hash)))
      .map((row) => publicListing(row))
    res.json({ items })
  }))

  app.get('/api/favorites/:id', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const row = (await store.load()).find((item) => String(item.id) === req.params.id)
    if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
    const isFav = (row._favoriteOwnerHashes || []).some((hash) => safeEqual(hash, owner.hash))
    res.json({ isFav })
  }))

  app.post('/api/favorites', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    const listingId = String(req.body?.listingId || '')
    if (!listingId) throw new HttpError(400, '매물 ID가 필요합니다.')
    await store.transaction((rows) => {
      const row = rows.find((item) => String(item.id) === listingId)
      if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      row._favoriteOwnerHashes = Array.isArray(row._favoriteOwnerHashes) ? row._favoriteOwnerHashes : []
      if (!row._favoriteOwnerHashes.some((hash) => safeEqual(hash, owner.hash))) {
        row._favoriteOwnerHashes.push(owner.hash)
      }
    })
    res.status(201).json({ ok: true })
  }))

  app.delete('/api/favorites/:id', asyncRoute(async (req, res) => {
    const owner = ownerContext(req, env)
    await store.transaction((rows) => {
      const row = rows.find((item) => String(item.id) === req.params.id)
      if (!row) throw new HttpError(404, '매물을 찾을 수 없습니다.')
      row._favoriteOwnerHashes = (row._favoriteOwnerHashes || []).filter((hash) => !safeEqual(hash, owner.hash))
    })
    res.json({ ok: true })
  }))

  app.post('/api/ai/recommend', asyncRoute(async (req, res) => {
    const rows = (await store.load()).map((row) => publicListing(row))
    res.json(await recommend(rows, req.body))
  }))
  app.post('/api/ai/simulate', asyncRoute(async (req, res) => res.json(simulate(req.body))))
  app.post('/api/ai/compare', asyncRoute(async (req, res) => {
    const regionA = String(req.body?.regionA || '').trim()
    const regionB = String(req.body?.regionB || '').trim()
    if (!regionA || !regionB) throw new HttpError(400, '비교할 두 지역을 입력해 주세요.')
    const rows = (await store.load()).map((row) => publicListing(row))
    res.json(compare(rows, regionA, regionB))
  }))
  app.post('/api/ai/market-analysis', asyncRoute(async (req, res) => {
    const location = String(req.body?.location || '').trim()
    const industries = Array.isArray(req.body?.industries) ? req.body.industries.filter(Boolean) : []
    if (!location || !industries.length) throw new HttpError(400, '지역과 관심 업종을 입력해 주세요.')
    const rows = (await store.load()).map((row) => publicListing(row))
    res.json(marketAnalysis(rows, req.body))
  }))
  app.post('/api/ai/chat', asyncRoute(async (req, res) => {
    const prompt = String(req.body?.prompt || '').trim()
    if (!prompt) throw new HttpError(400, '질문을 입력해 주세요.')
    if (prompt.length > 500) throw new HttpError(400, '질문은 500자 이하여야 합니다.')
    const rows = (await store.load()).map((row) => publicListing(row))
    res.json(chat(rows, prompt))
  }))

  app.get('/api/map/count-by-level', asyncRoute(async (req, res) => {
    const level = req.query.level === 'emd' ? 'emd' : 'sig'
    res.json(regionGroups(await store.load(), level, req.query))
  }))
  app.get('/api/region/counts', asyncRoute(async (req, res) => {
    const level = req.query.level === 'emd' ? 'emd' : 'sig'
    res.json(regionGroups(await store.load(), level, req.query))
  }))
  app.get('/api/map/listings-by-region', asyncRoute(async (req, res) => {
    const code = String(req.query.code || '')
    const level = req.query.level === 'emd' ? 'emd' : 'sig'
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    const rows = (await store.load()).map(normalizeStoredListing)
      .filter((row) => listingCode(row, level) === code)
      .slice(0, limit)
    res.json(rows.map((row) => publicListing(row)))
  }))
  app.get('/api/map/nearby-biz-counts', asyncRoute(async (req, res) => {
    const code = String(req.query.code || '')
    const rows = (await store.load()).map(normalizeStoredListing)
    const selected = code
      ? rows.filter((row) => listingCode(row, code.startsWith('emd:') ? 'emd' : 'sig') === code)
      : rows
    const counts = {}
    for (const row of selected) counts[row.category] = (counts[row.category] || 0) + 1
    res.json({ counts, source: 'registered-listings' })
  }))
  app.get(['/api/stats/nearby', '/api/agg/radius-categories'], asyncRoute(async (req, res) => {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Math.min(5_000, Math.max(100, Number(req.query.radius || 800)))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpError(400, '위도와 경도가 필요합니다.')
    const rows = (await store.load()).map(normalizeStoredListing)
    res.json({ counts: localNearbyCategoryCounts(rows, { lat, lng, radius }), source: 'registered-listings' })
  }))

  app.get('/api/support/news', asyncRoute(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1))
    const pageSize = Math.min(30, Math.max(1, Number(req.query.pageSize || 12)))
    const keyword = String(req.query.q || '').trim()
    const tag = String(req.query.tag || '').trim()
    const query = [keyword, tag, '창업 지원'].filter(Boolean).join(' ') || '서산 창업 지원 소상공인'
    const start = Math.min(1_000, (page - 1) * pageSize + 1)
    const result = await searchNaverNews({ env, query, display: pageSize, start })
    const hasNextPage = result.available
      && result.items.length === pageSize
      && start + result.items.length <= Math.min(result.total, 1_000)
    res.json({
      items: result.items,
      ...(hasNextPage ? { nextPage: page + 1 } : {}),
      source: result.source,
    })
  }))
  app.get('/api/support/news/:id', (req, res) => {
    res.status(404).json({ error: '지원 뉴스 공급자가 아직 설정되지 않았습니다.' })
  })

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 5 },
    fileFilter(req, file, callback) {
      const allowedTypes = new Set(['text/csv', 'application/vnd.ms-excel', 'text/plain'])
      const allowedExtension = file.originalname.toLowerCase().endsWith('.csv')
      const accepted = allowedTypes.has(file.mimetype) && allowedExtension
      callback(accepted ? null : new HttpError(400, 'CSV 파일만 업로드할 수 있습니다.'), accepted)
    },
  })
  app.post('/api/admin/upload-csv', upload.single('file'), asyncRoute(async (req, res) => {
    const configuredAdminKey = env.ADMIN_KEY?.trim()
    if (!configuredAdminKey) throw new HttpError(503, '관리자 업로드가 설정되지 않았습니다.')
    const providedAdminKey = requireHeader(req, 'X-Admin-Key', '관리자 키가 필요합니다.')
    if (!safeEqual(configuredAdminKey, providedAdminKey)) throw new HttpError(403, '관리자 키가 올바르지 않습니다.')
    if (!req.file?.buffer) throw new HttpError(400, 'CSV 파일이 필요합니다.')

    let csvRows
    try {
      csvRows = parseCsv(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true })
    } catch (error) {
      throw new HttpError(400, `CSV 형식을 해석할 수 없습니다: ${error.message}`)
    }
    if (csvRows.length > 500) throw new HttpError(400, '한 번에 최대 500건까지 업로드할 수 있습니다.')
    const report = { ok: true, total: csvRows.length, success: 0, failed: 0, errors: [], preview: [] }
    const validRows = []
    for (let index = 0; index < csvRows.length; index += 1) {
      try {
        const input = parseListingInput(csvToBody(csvRows[index]))
        validRows.push(input)
        report.preview.push(publicListing({ ...input, id: `preview-${index + 1}` }))
        report.success += 1
      } catch (error) {
        report.failed += 1
        report.errors.push({ line: index + 2, message: error.message })
      }
    }

    const mode = String(req.body?.mode || 'commit')
    if (mode === 'commit' && validRows.length) {
      await store.transaction((rows) => {
        const now = new Date().toISOString()
        for (const input of validRows) {
          rows.push({
            ...input,
            id: crypto.randomUUID(),
            _ownerHash: hashOwnerKey(`admin:${configuredAdminKey}`, env.OWNER_KEY_PEPPER || ''),
            _reviews: [],
            _favoriteOwnerHashes: [],
            createdAt: now,
            updatedAt: now,
          })
        }
      })
    }
    res.json(report)
  }))

  if (serveFrontend) {
    const dist = path.resolve(__dirname, '..', 'frontend', 'dist')
    if (existsSync(dist)) {
      app.use(express.static(dist))
      app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) return next()
        res.sendFile(path.join(dist, 'index.html'))
      })
    }
  }

  app.use('/api', (req, res) => res.status(404).json({ error: 'API 경로를 찾을 수 없습니다.' }))
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    const status = error instanceof multer.MulterError
      ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      : Number(error.status || 500)
    if (status >= 500) console.error(error)
    res.status(status).json({
      error: status >= 500 ? '서버 처리 중 오류가 발생했습니다.' : error.message,
      ...(error.details ? { details: error.details } : {}),
    })
  })

  return app
}
