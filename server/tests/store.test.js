import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { JsonListingStore } from '../services/store.js'

test('손상된 JSON 파일은 빈 배열로 덮어쓰지 않는다', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vacantai-store-'))
  const file = path.join(directory, 'listings.json')
  const damaged = '{ damaged json'
  await fs.writeFile(file, damaged)
  const store = new JsonListingStore(file)
  await assert.rejects(() => store.transaction((rows) => rows.push({ id: 'new' })), /해석할 수 없습니다/)
  assert.equal(await fs.readFile(file, 'utf8'), damaged)
  await fs.rm(directory, { recursive: true, force: true })
})

test('동시 트랜잭션은 직렬화되어 업데이트를 잃지 않는다', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vacantai-store-'))
  const file = path.join(directory, 'listings.json')
  await fs.writeFile(file, '[]')
  const store = new JsonListingStore(file)
  await Promise.all(Array.from({ length: 10 }, (_, index) => store.transaction((rows) => rows.push({ id: String(index) }))))
  assert.equal((await store.load()).length, 10)
  await fs.rm(directory, { recursive: true, force: true })
})
