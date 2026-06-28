import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { apiErrorMessage, getFavorites, getMyListings, type Listing } from '../services/api'
import { ensureAuthKey, maskKey } from '../lib/auth'

function ListingGrid({ items, empty }: { items: Listing[]; empty: string }) {
  if (!items.length) return <div className="text-sm text-gray-500">{empty}</div>
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => (
    <Link key={item.id} to={`/listings/${item.id}`} className="block overflow-hidden rounded-2xl border bg-white hover:shadow-md transition">
      {item.images[0] && <img src={item.images[0]} alt={item.title} className="w-full h-44 object-cover" />}
      <div className="p-3"><div className="font-semibold line-clamp-1">{item.title}</div><div className="text-xs text-gray-500 line-clamp-1">{item.address}</div></div>
    </Link>
  ))}</div>
}

export default function Account() {
  const authKey = useMemo(() => ensureAuthKey(), [])
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [mine, setMine] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getFavorites(authKey), getMyListings(authKey)])
      .then(([favoriteResponse, mineResponse]) => {
        if (!active) return
        setFavorites(favoriteResponse.items)
        setMine(mineResponse.items)
      })
      .catch((reason) => active && setError(apiErrorMessage(reason, '마이페이지 정보를 불러오지 못했습니다.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [authKey])

  return <div className="mx-auto px-4 w-[94vw] md:w-[80vw] xl:max-w-[1050px] space-y-6 pt-4">
    <Card><div className="flex items-center gap-2"><div className="font-semibold">내 식별 키</div><code className="px-2 py-1 bg-slate-100 rounded text-xs">{maskKey(authKey)}</code><button className="btn-outline ml-auto" onClick={() => navigator.clipboard.writeText(authKey)}>키 복사</button></div><p className="mt-2 text-sm text-gray-500">로그인 없이 이 키로 매물·리뷰·즐겨찾기를 관리합니다. 키를 공개하지 마세요.</p></Card>
    {error && <div className="text-sm text-rose-600">{error}</div>}
    <Card><div className="font-semibold mb-3">즐겨찾기한 매물</div>{loading ? <div className="text-sm text-gray-500">불러오는 중…</div> : <ListingGrid items={favorites} empty="아직 즐겨찾기한 매물이 없습니다." />}</Card>
    <Card><div className="font-semibold mb-3">내가 등록한 매물</div>{loading ? <div className="text-sm text-gray-500">불러오는 중…</div> : <ListingGrid items={mine} empty="내가 등록한 매물이 없습니다." />}</Card>
  </div>
}
