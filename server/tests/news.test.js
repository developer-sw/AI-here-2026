import test from 'node:test'
import assert from 'node:assert/strict'
import { searchNaverNews } from '../services/news.js'

test('네이버 뉴스 키가 없으면 외부 요청 없이 미설정 상태를 반환한다', async () => {
  let called = false
  const result = await searchNaverNews({
    env: {},
    query: '서산 창업',
    fetchImpl: async () => { called = true },
  })

  assert.equal(called, false)
  assert.equal(result.available, false)
  assert.equal(result.source, 'not-configured')
})

test('네이버 뉴스 응답을 화면용 데이터로 안전하게 변환한다', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url.searchParams.get('query'), '서산 창업')
    assert.equal(options.headers['X-Naver-Client-Id'], 'client-id')
    return new Response(JSON.stringify({
      total: 1,
      items: [{
        title: '<b>서산</b> 창업 &amp; 지원 소식',
        description: '청년 <b>창업</b> 지원 내용입니다.',
        originallink: 'https://news.example.com/article/1',
        link: 'https://n.news.naver.com/article/1',
        pubDate: 'Mon, 29 Jun 2026 09:00:00 +0900',
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const result = await searchNaverNews({
    env: { NAVER_SEARCH_CLIENT_ID: 'client-id', NAVER_SEARCH_CLIENT_SECRET: 'client-secret' },
    query: '서산 창업',
    fetchImpl,
  })

  assert.equal(result.available, true)
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].title, '서산 창업 & 지원 소식')
  assert.equal(result.items[0].summary, '청년 창업 지원 내용입니다.')
  assert.equal(result.items[0].url, 'https://news.example.com/article/1')
  assert.equal(result.items[0].source, 'news.example.com')
})
