export async function geocodeAddressNaver(address) {
  const id = process.env.NAVER_CLIENT_ID?.trim()
  const secret = process.env.NAVER_CLIENT_SECRET?.trim()
  if (!id || !secret) return null

  const url = new URL('https://maps.apigw.ntruss.com/map-geocode/v2/geocode')
  url.searchParams.set('query', address)
  const response = await fetch(url, {
    headers: {
      'x-ncp-apigw-api-key-id': id,
      'x-ncp-apigw-api-key': secret,
    },
    signal: AbortSignal.timeout(6_000),
  })
  if (!response.ok) throw new Error(`Naver Geocoding API 오류: ${response.status}`)
  const data = await response.json()
  const item = data?.addresses?.[0]
  if (!item) return null
  return { lat: Number(item.y), lng: Number(item.x), provider: 'naver' }
}
