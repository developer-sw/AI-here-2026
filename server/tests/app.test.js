import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createApp } from '../app.js'

async function json(response) {
  const body = await response.json()
  return { response, body }
}

test('매물·리뷰·즐겨찾기 API 생명주기와 비밀 필드 차단', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vacantai-api-'))
  const dataFile = path.join(directory, 'listings.json')
  await fs.writeFile(dataFile, JSON.stringify([{
    id: 'legacy-1', title: '기존 매물', address: '서산시', region: '부춘동',
    type: '상가', deposit: 1000, rent: 100, area: 50, images: [], theme: [],
    ownerKey: 'legacy-secret',
  }]))
  const app = createApp({
    dataFile,
    env: {
      CORS_ORIGINS: 'http://localhost:3000',
      OWNER_KEY_PEPPER: 'test-pepper',
      ADMIN_KEY: 'admin-secret',
      RATE_LIMIT_PER_MINUTE: '1000',
    },
  })
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await fs.rm(directory, { recursive: true, force: true })
  })

  const initial = await json(await fetch(`${base}/listings`))
  assert.equal(initial.response.status, 200)
  assert.equal(initial.body[0].type, 'MONTHLY')
  assert.equal('ownerKey' in initial.body[0], false)
  assert.equal('_ownerHash' in initial.body[0], false)

  const unauthorized = await fetch(`${base}/listings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  })
  assert.equal(unauthorized.status, 401)

  const created = await json(await fetch(`${base}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': 'owner-secret-key-123' },
    body: JSON.stringify({
      title: '테스트 월세', address: '충남 서산시 부춘동', region: '부춘동',
      category: '카페/디저트', type: 'MONTHLY', deposit: 2000, rentMonthly: 180,
      area: 55, images: [], theme: [],
    }),
  }))
  assert.equal(created.response.status, 201)
  assert.equal(created.body.type, 'MONTHLY')
  assert.equal('ownerKey' in created.body, false)

  const mine = await json(await fetch(`${base}/listings/mine`, { headers: { 'X-Owner-Key': 'owner-secret-key-123' } }))
  assert.equal(mine.body.items.length, 1)
  assert.equal(mine.body.items[0].id, created.body.id)

  const filtered = await json(await fetch(`${base}/listings?ids=${created.body.id}&category=${encodeURIComponent('카페/디저트')}`))
  assert.equal(filtered.body.length, 1)
  assert.equal(filtered.body[0].id, created.body.id)

  const forbiddenUpdate = await fetch(`${base}/listings/${created.body.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': 'wrong-owner' },
    body: JSON.stringify({ title: '탈취 시도' }),
  })
  assert.equal(forbiddenUpdate.status, 403)

  const updated = await json(await fetch(`${base}/listings/${created.body.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': 'owner-secret-key-123' },
    body: JSON.stringify({ title: '수정한 월세' }),
  }))
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.title, '수정한 월세')

  const favorite = await fetch(`${base}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': 'owner-secret-key-123' },
    body: JSON.stringify({ listingId: created.body.id }),
  })
  assert.equal(favorite.status, 201)
  const favorites = await json(await fetch(`${base}/favorites`, { headers: { 'X-Owner-Key': 'owner-secret-key-123' } }))
  assert.equal(favorites.body.items.length, 1)

  const review = await json(await fetch(`${base}/listings/${created.body.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': 'owner-secret-key-123' },
    body: JSON.stringify({ text: '좋은 위치입니다.', rating: 5 }),
  }))
  assert.equal(review.response.status, 201)
  assert.equal(review.body.canEdit, true)
  assert.equal('ownerHash' in review.body, false)

  const form = new FormData()
  form.append('mode', 'preview')
  form.append('file', new Blob([
    'title,address,region,category,type,price,images,theme\nCSV 매물,서산시,부춘동,식당,SALE,10000,,\n',
  ], { type: 'text/csv' }), 'listings.csv')
  const preview = await json(await fetch(`${base}/admin/upload-csv`, {
    method: 'POST', headers: { 'X-Admin-Key': 'admin-secret' }, body: form,
  }))
  assert.equal(preview.response.status, 200)
  assert.equal(preview.body.success, 1)
  assert.equal(preview.body.failed, 0)
  const afterPreview = await json(await fetch(`${base}/listings?q=${encodeURIComponent('CSV 매물')}`))
  assert.equal(afterPreview.body.length, 0)

  const deleted = await fetch(`${base}/listings/${created.body.id}`, {
    method: 'DELETE', headers: { 'X-Owner-Key': 'owner-secret-key-123' },
  })
  assert.equal(deleted.status, 200)
})
