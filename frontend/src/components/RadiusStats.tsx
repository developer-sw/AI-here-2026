import { useEffect, useMemo, useState } from 'react'
import { apiErrorMessage, getNearbyListingCounts } from '../services/api'

const DEFAULT_CATEGORIES = ['카페/디저트','식당','주점/호프','편의','패션/액세서리','뷰티/미용','의료/약국','문화/취미','레저/스포츠','사무/공유오피스','숙박','창고/물류','팝업/쇼룸','기타']

export default function RadiusStats({ lat, lng, defaultRadius = 800, maxRadius = 800, categories = DEFAULT_CATEGORIES }: { lat: number; lng: number; defaultRadius?: number; maxRadius?: number; categories?: string[] }) {
  const [radius, setRadius] = useState(Math.min(defaultRadius, maxRadius))
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const total = useMemo(() => Object.values(counts).reduce((sum, value) => sum + value, 0), [counts])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getNearbyListingCounts({ lat, lng, radius })
      .then((response) => active && setCounts(response.counts))
      .catch((reason) => active && setError(apiErrorMessage(reason, '주변 등록 매물을 집계하지 못했습니다.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [lat, lng, radius])

  return <div className="rounded-2xl border bg-white p-3"><div className="flex justify-between"><div className="font-semibold">반경 내 등록 매물 업종</div><div className="text-sm text-gray-600">{radius}m</div></div><input type="range" min={100} max={maxRadius} step={50} value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="w-full my-3" />{loading && <div className="text-sm text-gray-500">불러오는 중…</div>}{error && <div className="text-sm text-rose-600">{error}</div>}<div className="grid gap-2 sm:grid-cols-2">{categories.filter((category) => counts[category]).map((category) => <div key={category} className="flex justify-between rounded-xl border px-3 py-2"><span>{category}</span><b>{counts[category]}</b></div>)}</div>{!loading && !error && total === 0 && <div className="text-sm text-gray-500">해당 반경에 등록된 매물이 없습니다.</div>}<div className="mt-2 text-xs text-gray-500">실제 업소 수가 아니라 이 서비스에 등록된 매물의 업종 집계입니다.</div></div>
}
