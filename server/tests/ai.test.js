import test from 'node:test'
import assert from 'node:assert/strict'
import { chat } from '../services/ai.js'

const listings = [{
  id: 'listing-1',
  title: '서산 카페 추천 매물',
  address: '충남 서산시 부춘동',
  region: '부춘동',
  category: '카페/디저트',
  theme: ['주차 가능'],
}]

test('AI 메이트 기능 질문에는 사용 가능한 기능을 안내한다', () => {
  const result = chat(listings, '넌 뭘 할 수 있니?')

  assert.equal(result.method, 'guided-local-search-v3')
  assert.match(result.answer, /등록된 공실 매물/)
  assert.match(result.answer, /서산 카페 매물/)
  assert.deepEqual(result.listings, [])
})

test('AI 메이트는 지역과 업종으로 등록 매물을 검색한다', () => {
  const result = chat(listings, '서산 카페 매물 추천해줘')

  assert.equal(result.listings.length, 1)
  assert.equal(result.listings[0].id, 'listing-1')
})
