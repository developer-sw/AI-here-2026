import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchLhCommercialNotices } from '../services/lh.js'

test('공공데이터 키가 없으면 외부 요청 없이 미설정 상태를 반환한다', async () => {
  let called = false
  const result = await fetchLhCommercialNotices({
    env: {},
    fetchImpl: async () => { called = true },
    bypassCache: true,
  })

  assert.equal(called, false)
  assert.equal(result.status, 'not-configured')
  assert.deepEqual(result.items, [])
})

test('LH 중첩 응답을 외부 공고 매물 형태로 변환한다', async () => {
  const fetchImpl = async (url) => {
    assert.equal(url.searchParams.get('UPP_AIS_TP_CD'), '22')
    assert.equal(url.searchParams.get('CNP_CD'), '44')
    assert.equal(url.searchParams.get('ServiceKey'), 'service-key')
    return new Response(JSON.stringify({
      response: {
        body: {
          dsList: [{
            RNUM: '1',
            PAN_NM: '충남 공공상가 임대 공고',
            CNP_CD_NM: '충청남도',
            AIS_TP_CD_NM: '상가',
            PAN_SS: '공고중',
            PAN_NT_ST_DT: '20260629',
            ALL_CNT: '1',
            DTL_URL: 'https://apply.lh.or.kr/example',
          }],
        },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const result = await fetchLhCommercialNotices({
    env: { DATA_GO_KR_SERVICE_KEY: 'service-key' },
    regionCode: '44',
    fetchImpl,
    bypassCache: true,
    now: new Date('2026-06-29T00:00:00Z'),
  })

  assert.equal(result.status, 'ok')
  assert.equal(result.total, 1)
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].title, '충남 공공상가 임대 공고')
  assert.equal(result.items[0].source, 'lh-open-data')
  assert.equal(result.items[0].externalUrl, 'https://apply.lh.or.kr/example')
})

test('지역을 선택하지 않으면 전국 공고를 요청한다', async () => {
  const result = await fetchLhCommercialNotices({
    env: { DATA_GO_KR_SERVICE_KEY: 'service-key' },
    pageSize: 100,
    fetchImpl: async (url) => {
      assert.equal(url.searchParams.has('CNP_CD'), false)
      assert.equal(url.searchParams.get('PG_SZ'), '100')
      return new Response(JSON.stringify({ response: { body: { dsList: [] } } }), { status: 200 })
    },
    bypassCache: true,
  })

  assert.equal(result.status, 'ok')
})

test('승인 동기화 전의 401 응답은 오류 대신 반영 대기 상태를 반환한다', async () => {
  const result = await fetchLhCommercialNotices({
    env: { DATA_GO_KR_SERVICE_KEY: 'service-key' },
    fetchImpl: async () => new Response('Unauthorized', { status: 401 }),
    bypassCache: true,
  })

  assert.equal(result.status, 'authorization-pending')
  assert.equal(result.available, false)
  assert.deepEqual(result.items, [])
})
