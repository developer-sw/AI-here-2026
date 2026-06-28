import fs from 'node:fs/promises'
import path from 'node:path'

export class JsonListingStore {
  constructor(filePath) {
    this.filePath = filePath
    this.writeQueue = Promise.resolve()
  }

  async load() {
    let text
    try {
      text = await fs.readFile(this.filePath, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') return []
      throw error
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      throw new Error(`매물 데이터 파일을 해석할 수 없습니다: ${error.message}`)
    }
    if (!Array.isArray(parsed)) {
      throw new Error('매물 데이터 파일의 최상위 값은 배열이어야 합니다.')
    }
    return parsed
  }

  async transaction(mutator) {
    const run = async () => {
      const rows = await this.load()
      const result = await mutator(rows)
      await this.#writeAtomic(rows)
      return result
    }
    const task = this.writeQueue.then(run, run)
    this.writeQueue = task.catch(() => undefined)
    return task
  }

  async #writeAtomic(rows) {
    const directory = path.dirname(this.filePath)
    await fs.mkdir(directory, { recursive: true })
    const temporary = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
    await fs.writeFile(temporary, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
    try {
      await fs.rename(temporary, this.filePath)
    } catch (error) {
      await fs.rm(temporary, { force: true }).catch(() => undefined)
      throw error
    }
  }
}
