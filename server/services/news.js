import crypto from 'node:crypto'

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceName(item) {
  const target = item.originallink || item.link
  try {
    return new URL(target).hostname.replace(/^www\./, '')
  } catch {
    return '네이버 뉴스'
  }
}

function newsId(item) {
  return crypto.createHash('sha256')
    .update(String(item.originallink || item.link || item.title || ''))
    .digest('hex')
    .slice(0, 24)
}

export async function searchNaverNews({
  env = process.env,
  query,
  display = 12,
  start = 1,
  sort = 'date',
  fetchImpl = fetch,
} = {}) {
  const clientId = env.NAVER_SEARCH_CLIENT_ID?.trim()
  const clientSecret = env.NAVER_SEARCH_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    return { available: false, items: [], total: 0, source: 'not-configured' }
  }

  const url = new URL('https://openapi.naver.com/v1/search/news.json')
  url.searchParams.set('query', String(query || '서산 창업 지원 소상공인'))
  url.searchParams.set('display', String(Math.min(100, Math.max(1, Number(display) || 12))))
  url.searchParams.set('start', String(Math.min(1_000, Math.max(1, Number(start) || 1))))
  url.searchParams.set('sort', sort === 'sim' ? 'sim' : 'date')

  const response = await fetchImpl(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) {
    const error = new Error(`Naver News API 오류: ${response.status}`)
    error.status = 502
    throw error
  }

  const data = await response.json()
  const items = Array.isArray(data.items) ? data.items.map((item) => ({
    id: newsId(item),
    title: cleanText(item.title),
    summary: cleanText(item.description),
    url: item.originallink || item.link,
    source: sourceName(item),
    publishedAt: item.pubDate,
    tags: [],
  })).filter((item) => item.title && item.url) : []

  return {
    available: true,
    items,
    total: Number(data.total || items.length),
    source: 'naver-news-search',
  }
}
