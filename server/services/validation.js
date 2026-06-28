import crypto from 'node:crypto'
import { HttpError } from './security.js'

const TRADE_TYPES = new Set(['SALE', 'JEONSE', 'MONTHLY'])
const MAX_IMAGES = 10

function text(value, { name, required = false, max = 500, fallback = '' } = {}) {
  const result = typeof value === 'string' ? value.trim() : fallback
  if (required && !result) throw new HttpError(400, `${name}을(를) 입력해 주세요.`)
  if (result.length > max) throw new HttpError(400, `${name}은(는) ${max}자 이하여야 합니다.`)
  return result
}

function optionalNumber(value, { name, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === '' || value === undefined || value === null) return undefined
  const result = Number(value)
  if (!Number.isFinite(result) || result < min || result > max) {
    throw new HttpError(400, `${name} 값이 올바르지 않습니다.`)
  }
  return result
}

function tradeType(value) {
  const aliases = { 매매: 'SALE', 전세: 'JEONSE', 월세: 'MONTHLY' }
  const result = aliases[value] || value
  if (!TRADE_TYPES.has(result)) {
    throw new HttpError(400, '거래 유형은 SALE, JEONSE, MONTHLY 중 하나여야 합니다.')
  }
  return result
}

function imageUrls(value) {
  if (!Array.isArray(value)) return []
  if (value.length > MAX_IMAGES) throw new HttpError(400, `이미지는 최대 ${MAX_IMAGES}개까지 등록할 수 있습니다.`)
  return value.map((item) => {
    const url = text(item, { name: '이미지 URL', required: true, max: 2_000 })
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol')
      return parsed.toString()
    } catch {
      throw new HttpError(400, '이미지는 http 또는 https URL이어야 합니다.')
    }
  })
}

function coordinate(value, name, min, max) {
  return optionalNumber(value, { name, min, max })
}

export function inferTradeType(raw) {
  const explicit = raw.tradeType || raw.type
  if (TRADE_TYPES.has(explicit)) return explicit
  if (explicit === '매매' || explicit === '전세' || explicit === '월세') return tradeType(explicit)
  const rent = Number(raw.rentMonthly ?? raw.rent ?? 0)
  if (rent > 0) return 'MONTHLY'
  const price = Number(raw.price ?? 0)
  const deposit = Number(raw.deposit ?? 0)
  if (price > 0 || deposit > 0) return 'JEONSE'
  return 'SALE'
}

export function normalizeStoredListing(raw) {
  const type = inferTradeType(raw)
  const legacyType = typeof raw.type === 'string' && !TRADE_TYPES.has(raw.type) ? raw.type : ''
  const price = type === 'JEONSE'
    ? Number(raw.price ?? raw.deposit ?? 0) || undefined
    : Number(raw.price ?? 0) || undefined
  const deposit = type === 'MONTHLY' ? Number(raw.deposit ?? 0) || 0 : undefined
  const rentMonthly = type === 'MONTHLY' ? Number(raw.rentMonthly ?? raw.rent ?? 0) || 0 : undefined

  return {
    ...raw,
    id: String(raw.id || crypto.randomUUID()),
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : '무제',
    address: typeof raw.address === 'string' ? raw.address.trim() : '',
    region: typeof raw.region === 'string' ? raw.region.trim() : '',
    category: typeof raw.category === 'string' && raw.category.trim()
      ? raw.category.trim()
      : legacyType || '기타',
    type,
    price,
    deposit,
    rentMonthly,
    maintenanceFee: Number(raw.maintenanceFee ?? 0) || 0,
    area: Number(raw.area ?? 0) || undefined,
    lat: Number.isFinite(Number(raw.lat)) ? Number(raw.lat) : undefined,
    lng: Number.isFinite(Number(raw.lng)) ? Number(raw.lng) : undefined,
    images: Array.isArray(raw.images) ? raw.images.filter((item) => typeof item === 'string') : [],
    theme: Array.isArray(raw.theme) ? raw.theme.filter((item) => typeof item === 'string') : [],
    _reviews: Array.isArray(raw._reviews) ? raw._reviews : [],
    _favoriteOwnerHashes: Array.isArray(raw._favoriteOwnerHashes) ? raw._favoriteOwnerHashes : [],
  }
}

export function publicListing(raw, { canEdit = false } = {}) {
  const row = normalizeStoredListing(raw)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    address: row.address,
    region: row.region,
    category: row.category,
    type: row.type,
    price: row.price,
    deposit: row.deposit,
    rentMonthly: row.rentMonthly,
    maintenanceFee: row.maintenanceFee,
    area: row.area,
    lat: row.lat,
    lng: row.lng,
    sido: row.sido,
    sigungu: row.sigungu,
    dong: row.dong,
    sidoCode: row.sidoCode,
    sigunguCode: row.sigunguCode,
    dongCode: row.dongCode,
    images: row.images,
    theme: row.theme,
    phone: row.phone,
    availableFrom: row.availableFrom,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    favoritesCount: row._favoriteOwnerHashes.length,
    reviewsCount: row._reviews.length,
    canEdit,
  }
}

export function parseListingInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, '요청 본문이 올바르지 않습니다.')
  }

  const output = {}
  const assign = (key, value) => {
    if (!partial || body[key] !== undefined) output[key] = value
  }

  assign('title', text(body.title, { name: '제목', required: !partial, max: 120 }))
  assign('description', text(body.description, { name: '설명', max: 3_000 }))
  assign('address', text(body.address, { name: '주소', required: !partial, max: 300 }))
  assign('region', text(body.region, { name: '지역', max: 100 }))
  assign('category', text(body.category, { name: '카테고리', required: !partial, max: 80 }))
  if (!partial || body.type !== undefined) output.type = tradeType(body.type)
  if (!partial || body.images !== undefined) output.images = imageUrls(body.images)
  if (!partial || body.theme !== undefined) {
    output.theme = Array.isArray(body.theme)
      ? body.theme.slice(0, 10).map((item) => text(item, { name: '테마', required: true, max: 40 }))
      : []
  }

  for (const [key, label] of [
    ['price', '가격'],
    ['deposit', '보증금'],
    ['rentMonthly', '월세'],
    ['maintenanceFee', '관리비'],
    ['area', '면적'],
  ]) {
    if (!partial || body[key] !== undefined) output[key] = optionalNumber(body[key], { name: label, min: 0 })
  }

  if (!partial || body.lat !== undefined) output.lat = coordinate(body.lat, '위도', -90, 90)
  if (!partial || body.lng !== undefined) output.lng = coordinate(body.lng, '경도', -180, 180)

  for (const [key, label, max] of [
    ['sido', '시도', 40], ['sigungu', '시군구', 60], ['dong', '읍면동', 60],
    ['sidoCode', '시도 코드', 20], ['sigunguCode', '시군구 코드', 20], ['dongCode', '읍면동 코드', 20],
    ['phone', '연락처', 30], ['availableFrom', '입주 가능일', 30],
  ]) {
    assign(key, text(body[key], { name: label, max }))
  }

  const type = output.type || body.type
  const price = output.price ?? body.price
  const deposit = output.deposit ?? body.deposit
  const rentMonthly = output.rentMonthly ?? body.rentMonthly
  if (!partial && ['SALE', 'JEONSE'].includes(type) && price === undefined) {
    throw new HttpError(400, '매매·전세 가격을 입력해 주세요.')
  }
  if (!partial && type === 'MONTHLY' && (deposit === undefined || rentMonthly === undefined)) {
    throw new HttpError(400, '월세 보증금과 월세를 입력해 주세요.')
  }

  return output
}

export function parseReviewInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') throw new HttpError(400, '리뷰 내용이 올바르지 않습니다.')
  const result = {}
  if (!partial || body.text !== undefined) {
    result.text = text(body.text, { name: '리뷰', required: true, max: 1_000 })
  }
  if (!partial || body.nickname !== undefined) {
    result.nickname = text(body.nickname, { name: '닉네임', max: 30 }) || '익명'
  }
  if (!partial || body.rating !== undefined) {
    result.rating = body.rating === '' || body.rating === undefined || body.rating === null
      ? undefined
      : optionalNumber(body.rating, { name: '평점', min: 1, max: 5 })
  }
  return result
}
