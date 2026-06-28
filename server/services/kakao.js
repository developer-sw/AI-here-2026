const BASE_URL = 'https://dapi.kakao.com/v2/local'

async function kakaoGet(path, params) {
  const key = process.env.KAKAO_REST_KEY?.trim()
  if (!key) return null
  const url = new URL(`${BASE_URL}${path}`)
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value))
  }
  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    signal: AbortSignal.timeout(6_000),
  })
  if (!response.ok) throw new Error(`Kakao Local API 오류: ${response.status}`)
  return response.json()
}

export async function geocodeAddressKakao(address) {
  const data = await kakaoGet('/search/address.json', { query: address })
  const document = data?.documents?.[0]
  if (!document) return null
  return { lat: Number(document.y), lng: Number(document.x), provider: 'kakao' }
}

export async function searchKeyword({ query, x, y, radius = 1_000 }) {
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) {
    return { available: false, total: null, items: [] }
  }
  const data = await kakaoGet('/search/keyword.json', { query, x, y, radius, sort: 'distance' })
  if (!data) return { available: false, total: null, items: [] }
  const items = data.documents || []
  return { available: true, total: Number(data.meta?.total_count ?? items.length), items }
}

export async function searchCategory({ code, x, y, radius = 1_000 }) {
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) {
    return { available: false, total: null, items: [] }
  }
  const data = await kakaoGet('/search/category.json', {
    category_group_code: code,
    x,
    y,
    radius,
    sort: 'distance',
  })
  if (!data) return { available: false, total: null, items: [] }
  const items = data.documents || []
  return { available: true, total: Number(data.meta?.total_count ?? items.length), items }
}
