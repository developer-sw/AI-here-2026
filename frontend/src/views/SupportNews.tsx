import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiErrorMessage, getSupportNews, type SupportNews } from '../services/api'

const TAGS = ['전체', '청년창업', '지원금', '정책', '교육/멘토링'] as const
type Tag = typeof TAGS[number]

function validTag(value: string): Tag { return TAGS.includes(value as Tag) ? value as Tag : '전체' }

export default function SupportNews() {
  const [params, setParams] = useSearchParams()
  const appliedQuery = params.get('q') || ''
  const appliedTag = validTag(params.get('tag') || '전체')
  const [draftQuery, setDraftQuery] = useState(appliedQuery)
  const [items, setItems] = useState<SupportNews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => { setDraftQuery(appliedQuery) }, [appliedQuery])
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getSupportNews({ q: appliedQuery || undefined, tag: appliedTag === '전체' ? undefined : appliedTag })
      .then((response) => { if (active) { setItems(response.items); setSource(response.source || '') } })
      .catch((reason) => active && setError(apiErrorMessage(reason, '창업 지원 정보를 불러오지 못했습니다.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [appliedQuery, appliedTag])

  const apply = (event: FormEvent) => {
    event.preventDefault()
    const next = new URLSearchParams()
    if (draftQuery.trim()) next.set('q', draftQuery.trim())
    if (appliedTag !== '전체') next.set('tag', appliedTag)
    setParams(next)
  }
  const changeTag = (tag: Tag) => {
    const next = new URLSearchParams(params)
    if (tag === '전체') next.delete('tag'); else next.set('tag', tag)
    setParams(next)
  }

  return <div className="mx-auto px-4 w-[94vw] md:w-[80vw] xl:max-w-[1050px] py-6"><h1 className="text-xl font-semibold mb-3">창업 지원 · 뉴스</h1><form onSubmit={apply} className="card p-3 mb-4 flex flex-wrap gap-2"><div className="flex gap-1 flex-wrap">{TAGS.map((tag) => <button type="button" key={tag} onClick={() => changeTag(tag)} className={`px-3 py-1.5 rounded-full text-sm border ${appliedTag === tag ? 'bg-brand-600 text-white' : 'bg-white'}`}>{tag}</button>)}</div><div className="ml-auto flex gap-2"><input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} className="input w-64" placeholder="키워드 검색" /><button className="btn-primary">검색</button></div></form>{loading && <div className="text-sm text-gray-500">불러오는 중…</div>}{error && <div className="text-sm text-rose-600">{error}</div>}{!loading && !error && !items.length && <div className="card p-6 text-center text-gray-600">{source === 'not-configured' ? '뉴스 공급자가 아직 연결되지 않았습니다. 임의의 기사를 대신 표시하지 않습니다.' : '조건에 맞는 기사가 없습니다.'}</div>}<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="card overflow-hidden hover:shadow-md">{item.thumbnail && <img src={item.thumbnail} alt="" className="w-full h-40 object-cover" />}<div className="p-4"><div className="text-xs text-gray-500">{item.source} · {new Date(item.publishedAt).toLocaleDateString('ko-KR')}</div><div className="font-semibold mt-1">{item.title}</div><p className="text-sm text-gray-700 mt-1">{item.summary}</p></div></a>)}</div></div>
}
