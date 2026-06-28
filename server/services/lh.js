import crypto from 'node:crypto'

const ENDPOINT = 'https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1'
const CACHE_TTL_MS = 10 * 60 * 1_000
const cache = new Map()

function normalizeServiceKey(value) {
  const key = String(value || '').trim().replace(/^['"]|['"]$/g, '')
  if (!key.includes('%')) return key
  try {
    return decodeURIComponent(key)
  } catch {
    return key
  }
}

function compactDate(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '')
}

function addDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function collectNoticeRows(value, rows = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectNoticeRows(item, rows)
    return rows
  }
  if (!value || typeof value !== 'object') return rows
  if (value.PAN_NM && (value.DTL_URL || value.PAN_ID || value.RNUM)) rows.push(value)
  for (const nested of Object.values(value)) collectNoticeRows(nested, rows)
  return rows
}

function noticeId(row) {
  const seed = row.DTL_URL || row.PAN_ID || `${row.PAN_NM}:${row.PAN_NT_ST_DT || ''}`
  return `lh-${crypto.createHash('sha256').update(String(seed)).digest('hex').slice(0, 24)}`
}

function toListing(row) {
  const region = cleanText(row.CNP_CD_NM || row.CNP_NM || '지역 미표기')
  const detailUrl = safeHttpUrl(row.DTL_URL)
  const noticeType = cleanText(row.AIS_TP_CD_NM || row.UPP_AIS_TP_NM || '상가')
  const status = cleanText(row.PAN_SS || row.PAN_SS_NM)
  return {
    id: noticeId(row),
    title: cleanText(row.PAN_NM),
    region,
    address: `${region} LH ${noticeType} 공급 공고`,
    category: '공공상가',
    type: 'MONTHLY',
    images: [],
    theme: ['LH 공공데이터', noticeType, status].filter(Boolean),
    description: status ? `공고 상태: ${status}` : 'LH 분양·임대 공고입니다.',
    availableFrom: cleanText(row.CLSG_DT || row.PAN_NT_ST_DT) || undefined,
    createdAt: cleanText(row.PAN_NT_ST_DT) || undefined,
    favoritesCount: 0,
    reviewsCount: 0,
    canEdit: false,
    source: 'lh-open-data',
    sourceLabel: 'LH 공공상가 공고',
    externalUrl: detailUrl || undefined,
    pricingNote: '임대·공급 조건은 원문 공고에서 확인',
  }
}

function authorizationPending(message = '') {
  return {
    available: false,
    status: 'authorization-pending',
    source: 'lh-open-data',
    items: [],
    total: 0,
    message: message || '공공데이터포털 승인 정보가 API 서버에 반영되는 중입니다.',
  }
}

export async function fetchLhCommercialNotices({
  env = process.env,
  keyword = '',
  page = 1,
  pageSize = 30,
  regionCode: requestedRegionCode = '',
  fetchImpl = fetch,
  now = new Date(),
  bypassCache = false,
} = {}) {
  const serviceKey = normalizeServiceKey(env.DATA_GO_KR_SERVICE_KEY)
  if (!serviceKey) {
    return {
      available: false,
      status: 'not-configured',
      source: 'not-configured',
      items: [],
      total: 0,
      message: '공공데이터포털 인증키가 설정되지 않았습니다.',
    }
  }

  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 30))
  const query = String(keyword || '').trim()
  const rawRegionCode = String(requestedRegionCode || '').trim()
  const regionCode = /^\d{2}$/.test(rawRegionCode) ? rawRegionCode : ''
  const cacheKey = JSON.stringify([query, safePage, safePageSize, regionCode])
  const cached = cache.get(cacheKey)
  if (!bypassCache && cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.value

  const url = new URL(ENDPOINT)
  url.searchParams.set('ServiceKey', serviceKey)
  url.searchParams.set('PG_SZ', String(safePageSize))
  url.searchParams.set('PAGE', String(safePage))
  url.searchParams.set('UPP_AIS_TP_CD', '22')
  if (regionCode) url.searchParams.set('CNP_CD', regionCode)
  url.searchParams.set('PAN_NT_ST_DT', compactDate(addDays(now, -730)))
  url.searchParams.set('CLSG_DT', compactDate(addDays(now, 365)))
  url.searchParams.set('type', 'json')
  if (query) url.searchParams.set('PAN_NM', query)

  const response = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) })
  const body = await response.text()
  if ([401, 403].includes(response.status)) return authorizationPending()
  if (!response.ok) {
    const error = new Error(`LH Open API 오류: ${response.status}`)
    error.status = 502
    throw error
  }

  if (/SERVICE_KEY|UNAUTHORIZED|AUTHENTICATION|인증키/i.test(body) && /ERROR|INVALID|등록되지|인증/i.test(body)) {
    return authorizationPending()
  }

  let data
  try {
    data = JSON.parse(body)
  } catch {
    const error = new Error('LH Open API가 JSON이 아닌 응답을 반환했습니다.')
    error.status = 502
    throw error
  }

  const seen = new Set()
  const items = collectNoticeRows(data)
    .map(toListing)
    .filter((item) => item.title && !seen.has(item.id) && seen.add(item.id))
  const firstCount = collectNoticeRows(data)[0]?.ALL_CNT
  const total = Number(firstCount) || items.length
  const value = {
    available: true,
    status: 'ok',
    source: 'lh-open-data',
    items,
    total,
    message: items.length ? undefined : '현재 검색 조건에 맞는 LH 공공상가 공고가 없습니다.',
  }
  cache.set(cacheKey, { savedAt: Date.now(), value })
  return value
}
