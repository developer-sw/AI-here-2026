import { useEffect, useState } from 'react'
import { addFavorite, apiErrorMessage, isFavorite, removeFavorite } from '../services/api'

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setBusy(true)
    isFavorite(listingId)
      .then((value) => mounted && setActive(value))
      .catch((reason) => mounted && setError(apiErrorMessage(reason, '즐겨찾기 상태를 확인하지 못했습니다.')))
      .finally(() => mounted && setBusy(false))
    return () => { mounted = false }
  }, [listingId])

  const toggle = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      if (active) await removeFavorite(listingId)
      else await addFavorite(listingId)
      setActive(!active)
    } catch (reason) {
      setError(apiErrorMessage(reason, '즐겨찾기를 변경하지 못했습니다.'))
    } finally { setBusy(false) }
  }

  return <div className="ml-auto text-right"><button onClick={() => void toggle()} disabled={busy} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${active ? 'bg-rose-50 text-rose-600' : 'bg-white border text-gray-700'}`}>{active ? '♥ 저장됨' : '♡ 즐겨찾기'}</button>{error && <div className="mt-1 text-xs text-rose-600">{error}</div>}</div>
}
