import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SearchHero from '../components/SearchHero'
import CategoryGrid from '../components/CategoryGrid'
import {
  apiErrorMessage,
  getLhCommercialNotices,
  getListings,
  type Listing,
  type PublicListingsResponse,
} from '../services/api'

type DealType = 'all' | 'sale' | 'jeonse' | 'wolse'
type SortKey = 'price' | 'area' | 'popular' | 'newest'
type PublicStatus = PublicListingsResponse['status'] | 'idle'

const dealOptions: Array<{ key: DealType; label: string }> = [
  { key: 'all', label: '전체' }, { key: 'sale', label: '매매' },
  { key: 'jeonse', label: '전세' }, { key: 'wolse', label: '월세' },
]
const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'newest', label: '최신순' }, { key: 'price', label: '가격순' },
  { key: 'area', label: '면적순' }, { key: 'popular', label: '인기순' },
]

const regionOptions = [
  { code: '', label: '전국' },
  { code: '11', label: '서울' }, { code: '26', label: '부산' },
  { code: '27', label: '대구' }, { code: '28', label: '인천' },
  { code: '29', label: '광주' }, { code: '30', label: '대전' },
  { code: '31', label: '울산' }, { code: '36', label: '세종' },
  { code: '41', label: '경기' }, { code: '42', label: '강원' },
  { code: '43', label: '충북' }, { code: '44', label: '충남' },
  { code: '45', label: '전북' }, { code: '46', label: '전남' },
  { code: '47', label: '경북' }, { code: '48', label: '경남' },
  { code: '50', label: '제주' },
]

function priceLabel(item: Listing) {
  if (item.pricingNote) return item.pricingNote
  if (item.type === 'MONTHLY') return `보증금 ${(item.deposit ?? 0).toLocaleString()}만 / 월세 ${(item.rentMonthly ?? 0).toLocaleString()}만`
  if (item.type === 'JEONSE') return `전세 ${(item.price ?? 0).toLocaleString()}만`
  return `매매가 ${(item.price ?? 0).toLocaleString()}만`
}

function ListingCard({ item }: { item: Listing }) {
  const card = <>
    {item.images[0] && <img src={item.images[0]} alt={item.title} className="h-[220px] w-full object-cover bg-slate-100" />}
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold">{item.title}</div>
        {item.sourceLabel && <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{item.sourceLabel}</span>}
      </div>
      <div className="text-sm text-gray-600">{item.region ? `${item.region} · ` : ''}{item.address}</div>
      <div className="text-sm mt-2">{priceLabel(item)}{item.area ? ` · ${item.area}㎡` : ''}</div>
      <div className="mt-2 flex gap-2 flex-wrap">
        <span className="chip">{item.category}</span>
        {item.theme.slice(0, 3).map((theme) => <span key={theme} className="chip">{theme}</span>)}
      </div>
      {item.externalUrl && <div className="mt-3 text-sm font-medium text-brand-700">LH 원문 공고에서 상세 조건 확인 →</div>}
    </div>
  </>
  const className = 'block bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition'
  if (item.externalUrl) {
    return <a href={item.externalUrl} target="_blank" rel="noreferrer" className={className}>{card}</a>
  }
  return <Link to={`/listings/${item.id}`} className={className}>{card}</Link>
}

function PublicNotice({ status, count, message }: { status: PublicStatus; count: number; message: string }) {
  if (status === 'idle' || (status === 'ok' && !count && !message)) return null
  let className = 'mb-4 rounded-xl border px-4 py-3 text-sm '
  let content: ReactNode = message
  if (status === 'ok' && count) {
    className += 'border-blue-200 bg-blue-50 text-blue-800'
    content = `LH 공공데이터에서 공공상가 공고 ${count}건을 함께 표시합니다.`
  } else if (status === 'authorization-pending') {
    className += 'border-amber-200 bg-amber-50 text-amber-800'
    content = message || '공공데이터포털 승인 정보가 API 서버에 반영되는 중입니다. 반영 후 실제 공고가 자동으로 표시됩니다.'
  } else if (status === 'not-configured') {
    className += 'border-amber-200 bg-amber-50 text-amber-800'
  } else {
    className += 'border-slate-200 bg-white text-slate-600'
  }
  return <div className={className}>{content}</div>
}

export default function Listings() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publicStatus, setPublicStatus] = useState<PublicStatus>('idle')
  const [publicMessage, setPublicMessage] = useState('')
  const [publicCount, setPublicCount] = useState(0)
  const dealType = (params.get('dealType') || 'all') as DealType
  const sort = (params.get('sort') || 'newest') as SortKey
  const lhRegionCode = params.get('lhRegion') || ''

  const updateParam = (name: string, value: string, defaultValue?: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === defaultValue) next.delete(name)
    else next.set(name, value)
    setParams(next)
  }

  useEffect(() => {
    let active = true
    const query = params.get('q') || undefined
    const category = params.get('category') || undefined
    const theme = params.get('theme') || undefined
    setLoading(true)
    setError('')

    Promise.allSettled([
      getListings({
        q: query,
        region: params.get('region') || undefined,
        category,
        theme,
        dealType,
        sort,
      }),
      getLhCommercialNotices({ q: query, pageSize: 100, regionCode: lhRegionCode || undefined }),
    ]).then(([localResult, publicResult]) => {
      if (!active) return
      const localItems = localResult.status === 'fulfilled' ? localResult.value : []
      if (localResult.status === 'rejected') {
        setError(apiErrorMessage(localResult.reason, '자체 등록 매물 목록을 불러오지 못했습니다.'))
      }

      let publicItems: Listing[] = []
      if (publicResult.status === 'fulfilled') {
        const result = publicResult.value
        setPublicStatus(result.status)
        setPublicMessage(result.message || '')
        const canShow = !category && !theme && (dealType === 'all' || dealType === 'wolse')
        publicItems = canShow ? result.items : []
        setPublicCount(publicItems.length)
      } else {
        setPublicStatus('error')
        setPublicMessage('LH 공고를 불러오지 못해 자체 등록 매물만 표시합니다.')
        setPublicCount(0)
      }

      setRows(sort === 'newest' ? [...publicItems, ...localItems] : [...localItems, ...publicItems])
    }).finally(() => active && setLoading(false))

    return () => { active = false }
  }, [params, dealType, sort])

  return <div className="mx-auto px-4 w-[94vw] md:w-[80vw] xl:max-w-[1050px]">
    <div className="pt-6 pb-3"><h1 className="text-2xl font-bold">공실 매물</h1></div>
    <div className="mb-4"><SearchHero noBg /></div>
    <div className="mb-4"><CategoryGrid /></div>
    <div className="sticky top-[68px] z-10 bg-slate-50/90 backdrop-blur border-y py-2 mb-4 flex flex-wrap gap-3">
      <div className="flex items-center gap-3">{dealOptions.map((option) => <label key={option.key} className="inline-flex items-center gap-1.5 text-sm"><input type="radio" checked={dealType === option.key} onChange={() => updateParam('dealType', option.key, 'all')} />{option.label}</label>)}</div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <span className="font-medium">LH 지역</span>
        <select
          value={lhRegionCode}
          onChange={(event) => updateParam('lhRegion', event.target.value, '')}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
          aria-label="LH 공공상가 지역 선택"
        >
          {regionOptions.map((region) => <option key={region.code || 'all'} value={region.code}>{region.label}</option>)}
        </select>
      </label>
      <div className="ml-auto flex items-center gap-3">{sortOptions.map((option) => <button key={option.key} onClick={() => updateParam('sort', option.key, 'newest')} className={`text-sm ${sort === option.key ? 'font-semibold text-brand-700' : 'text-gray-600'}`}>{sort === option.key ? '✓ ' : ''}{option.label}</button>)}</div>
    </div>
    <PublicNotice status={publicStatus} count={publicCount} message={publicMessage} />
    {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
    {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}
    {!loading && rows.length === 0 && <div className="text-sm text-gray-500">조건에 맞는 매물이 없습니다.</div>}
    <div className="space-y-4">{rows.map((item) => <ListingCard key={item.id} item={item} />)}</div>
  </div>
}
