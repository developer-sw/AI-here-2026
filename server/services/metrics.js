import { searchKeyword, searchCategory } from './kakao.js'

const CATEGORY_CODES = {
  cafe: 'CE7',
  restaurant: 'FD6',
  convenience: 'CS2',
}

export async function measureCompetition({ lat, lng, keywords = ['카페', '분식', '치킨'], radius = 700 }) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return { available: false, total: null, byKeyword: {}, byCategory: {} }
  }

  const keywordResults = await Promise.all(keywords.map(async (query) => {
    try {
      return [query, await searchKeyword({ query, x: lng, y: lat, radius })]
    } catch {
      return [query, { available: false, total: null }]
    }
  }))
  const categoryResults = await Promise.all(Object.entries(CATEGORY_CODES).map(async ([name, code]) => {
    try {
      return [name, await searchCategory({ code, x: lng, y: lat, radius })]
    } catch {
      return [name, { available: false, total: null }]
    }
  }))

  const available = keywordResults.some(([, result]) => result.available)
  const byKeyword = Object.fromEntries(keywordResults.map(([name, result]) => [name, result.total]))
  const byCategory = Object.fromEntries(categoryResults.map(([name, result]) => [name, result.total]))
  const knownTotals = keywordResults
    .map(([, result]) => result.available ? Number(result.total || 0) : null)
    .filter((value) => value !== null)

  return {
    available,
    total: available ? Math.max(...knownTotals, 0) : null,
    byKeyword,
    byCategory,
    note: '키워드 검색 결과가 겹칠 수 있어 최대값을 경쟁도 근사치로 사용합니다.',
  }
}

export function scoreByCompetition(total) {
  if (!Number.isFinite(Number(total))) return null
  if (total <= 5) return 90
  if (total <= 20) return 75
  if (total <= 50) return 55
  if (total <= 120) return 35
  return 20
}

export function rentIndex({ rent, area }) {
  if (!Number.isFinite(Number(rent)) || !Number.isFinite(Number(area)) || Number(area) <= 0) return null
  const perSquareMeter = Number(rent) / Number(area)
  const clamped = Math.min(6, Math.max(1, perSquareMeter))
  return Math.round(((clamped - 1) / 5) * 80 + 10)
}

export function footTrafficHeuristic(region) {
  const table = { 부춘동: 80, 동문1동: 75, 동문2동: 68, 수석동: 60, 석남동: 65, 해미읍: 50 }
  return table[region] ?? 55
}

export function youthHeuristic(region) {
  const table = { 부춘동: 65, 동문1동: 70, 동문2동: 62, 수석동: 58, 석남동: 60, 해미읍: 45 }
  return table[region] ?? 55
}

export function haversineMeters(a, b) {
  const toRadians = (degrees) => degrees * Math.PI / 180
  const earthRadius = 6_371_000
  const latitudeDelta = toRadians(b.lat - a.lat)
  const longitudeDelta = toRadians(b.lng - a.lng)
  const latitude1 = toRadians(a.lat)
  const latitude2 = toRadians(b.lat)
  const h = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(h))
}

export function localNearbyCategoryCounts(listings, { lat, lng, radius = 800 }) {
  const center = { lat: Number(lat), lng: Number(lng) }
  if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return {}
  const counts = {}
  for (const listing of listings) {
    if (!Number.isFinite(listing.lat) || !Number.isFinite(listing.lng)) continue
    if (haversineMeters(center, listing) > radius) continue
    const category = listing.category || '기타'
    counts[category] = (counts[category] || 0) + 1
  }
  return counts
}

export function regionSnapshot(listings, region) {
  const target = listings.filter((listing) => [listing.region, listing.dong, listing.sigungu].includes(region))
  const rentPerArea = target
    .map((listing) => {
      const rent = listing.rentMonthly
      return rent && listing.area ? rent / listing.area : null
    })
    .filter((value) => value !== null)
    .sort((a, b) => a - b)
  const median = rentPerArea.length
    ? rentPerArea[Math.floor(rentPerArea.length / 2)]
    : null
  return {
    listingCount: target.length,
    rentPerSquareMeter: median === null ? null : Number(median.toFixed(2)),
    footTraffic: footTrafficHeuristic(region),
    youth: youthHeuristic(region),
  }
}
