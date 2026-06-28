import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '../lib/kakao'

type Props = { lat: number; lng: number; level?: number; height?: number | string; className?: string }

export default function Map({ lat, lng, level = 4, height, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    let cleanup: () => void = () => {}
    loadKakaoMaps().then(() => {
      if (disposed || !ref.current) return
      const kakao = window.kakao
      const center = new kakao.maps.LatLng(lat, lng)
      const map = new kakao.maps.Map(ref.current, { center, level })
      new kakao.maps.Marker({ position: center, map })
      const onResize = () => { map.relayout(); map.setCenter(center) }
      window.addEventListener('resize', onResize)
      cleanup = () => window.removeEventListener('resize', onResize)
    }).catch((reason) => !disposed && setError(reason instanceof Error ? reason.message : '지도를 불러오지 못했습니다.'))
    return () => { disposed = true; cleanup() }
  }, [lat, lng, level])

  const style = height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined
  if (error) return <div className="rounded-xl bg-slate-100 p-4 text-sm text-gray-600">{error}</div>
  return <div ref={ref} className={`w-full rounded-xl bg-slate-100 ${className || 'h-64'}`} style={style} />
}
