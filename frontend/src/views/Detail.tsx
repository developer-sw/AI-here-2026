import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Card from '../components/Card'
import Map from '../components/Map'
import RadiusStats from '../components/RadiusStats'
import FavoriteButton from '../components/FavoriteButton'
import ReviewList from '../components/ReviewList'
import { aiSimulate, apiErrorMessage, getListing, type Listing, type SimulationResponse } from '../services/api'

const format = (value?: number) => value === undefined ? '-' : value.toLocaleString()

function PriceBlock({ item }: { item: Listing }) {
  return <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
    <div><span className="text-gray-500 mr-1">거래유형</span><b>{{ SALE: '매매', JEONSE: '전세', MONTHLY: '월세' }[item.type]}</b></div>
    {item.type === 'MONTHLY' ? <><div><span className="text-gray-500 mr-1">보증금</span><b>{format(item.deposit)}만원</b></div><div><span className="text-gray-500 mr-1">월세</span><b>{format(item.rentMonthly)}만원</b></div></> : <div><span className="text-gray-500 mr-1">{item.type === 'SALE' ? '매매가' : '전세보증금'}</span><b>{format(item.price)}만원</b></div>}
    <div><span className="text-gray-500 mr-1">관리비</span><b>{format(item.maintenanceFee)}만원</b></div>
    <div><span className="text-gray-500 mr-1">면적</span><b>{format(item.area)}㎡</b></div>
  </div>
}

export default function Detail() {
  const { id } = useParams()
  const [item, setItem] = useState<Listing | null>(null)
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    setItem(null); setLoading(true); setError('')
    getListing(id).then((value) => active && setItem(value))
      .catch((reason) => active && setError(apiErrorMessage(reason, '매물을 불러오지 못했습니다.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const runSimulation = async () => {
    if (!item || simulating) return
    setSimulating(true); setError('')
    try {
      setSimulation(await aiSimulate({ region: item.region, category: item.category, area: item.area ?? 50, rent: item.rentMonthly ?? 0 }))
    } catch (reason) { setError(apiErrorMessage(reason, '손익 시뮬레이션을 실행하지 못했습니다.')) }
    finally { setSimulating(false) }
  }

  if (loading) return <div className="center-col p-6 text-sm text-gray-500">불러오는 중…</div>
  if (error && !item) return <div className="center-col p-6"><div className="text-rose-600">{error}</div><Link to="/listings" className="btn-outline mt-3">목록으로</Link></div>
  if (!item || !id) return null

  return <div className="mx-auto px-4 w-[94vw] md:w-[80vw] xl:max-w-[1050px] space-y-6">
    <Card>{item.images[0] && <img src={item.images[0]} alt={item.title} className="w-full h-72 object-cover rounded-xl" />}<div className="mt-3 flex items-start gap-3"><h1 className="text-2xl font-bold">{item.title}</h1><FavoriteButton listingId={item.id} /></div><div className="text-sm text-gray-500">{item.region ? `${item.region} · ` : ''}{item.address}</div><div className="mt-2 flex gap-2"><span className="chip">{item.category}</span>{item.theme.map((theme) => <span key={theme} className="chip">{theme}</span>)}</div><div className="mt-3"><PriceBlock item={item} /></div>{item.description && <p className="mt-3 whitespace-pre-wrap">{item.description}</p>}<div className="mt-3 text-sm"><span className="text-gray-500">연락처 </span>{item.phone ? <a href={`tel:${item.phone.replace(/\D/g, '')}`} className="underline">{item.phone}</a> : '-'}<span className="ml-5 text-gray-500">입주 가능일 </span>{item.availableFrom || '-'}</div></Card>
    {Number.isFinite(item.lat) && Number.isFinite(item.lng) && <><Card><div className="font-semibold mb-3">지도</div><Map lat={item.lat!} lng={item.lng!} className="h-[380px] md:h-[520px]" /></Card><RadiusStats lat={item.lat!} lng={item.lng!} /></>}
    <Card><div className="flex items-center"><div><div className="font-semibold">손익 참고 계산</div><div className="text-xs text-gray-500">등록 매물 조건과 지역 휴리스틱을 사용합니다.</div></div><button className="btn-primary ml-auto" disabled={simulating} onClick={() => void runSimulation()}>{simulating ? '계산 중…' : '계산하기'}</button></div>{simulation && <div className="mt-3 grid sm:grid-cols-3 gap-2 text-sm"><div>예상 월매출 <b>{simulation.estimatedSales.toLocaleString()}만원</b></div><div>예상 영업이익 <b>{simulation.operatingProfit.toLocaleString()}만원</b></div><div>BEP 매출 <b>{simulation.bepSales?.toLocaleString() ?? '-'}만원</b></div></div>}{error && item && <div className="mt-2 text-sm text-rose-600">{error}</div>}</Card>
    <Card><ReviewList listingId={id} /></Card>
  </div>
}
