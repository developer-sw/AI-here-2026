import { useCallback, useEffect, useRef, useState } from 'react'
import { apiErrorMessage, getListingsByRegion, getNearbyBizCounts, getRegionCounts, type Listing } from '../services/api'
import { loadKakaoMaps } from '../lib/kakao'
import MapRightPanel, { type Cluster } from '../components/MapRightPanel'

type OverlayEntry = { overlay: any; element: HTMLButtonElement; handler: () => void }

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<OverlayEntry[]>([])
  const searchMarkerRef = useRef<any>(null)
  const refreshRef = useRef<() => void>(() => undefined)
  const clusterClickRef = useRef<(cluster: Cluster) => void>(() => undefined)
  const requestSequence = useRef(0)
  const [mapReady, setMapReady] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(7)
  const [onlyWithCoords, setOnlyWithCoords] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [theme, setTheme] = useState('')
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelStep, setPanelStep] = useState<'sig' | 'emd' | 'category'>('sig')
  const [sigList, setSigList] = useState<Cluster[]>([])
  const [selectedSig, setSelectedSig] = useState<Cluster | null>(null)
  const [emdList, setEmdList] = useState<Cluster[]>([])
  const [selectedEmd, setSelectedEmd] = useState<Cluster | null>(null)
  const [bizCounts, setBizCounts] = useState<Record<string, number> | null>(null)
  const [regionListings, setRegionListings] = useState<Listing[]>([])
  const currentLevel: 'sig' | 'emd' = zoomLevel <= 6 ? 'emd' : 'sig'

  const clearOverlays = useCallback(() => {
    for (const entry of overlaysRef.current) {
      entry.element.removeEventListener('click', entry.handler)
      entry.overlay.setMap(null)
    }
    overlaysRef.current = []
  }, [])

  const renderClusters = useCallback((items: Cluster[]) => {
    const map = mapRef.current
    if (!map || !window.kakao?.maps) return
    clearOverlays()
    for (const cluster of items) {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = 'inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-lg'
      const count = document.createElement('span')
      count.className = 'rounded-full bg-white/20 px-2 py-1'
      count.textContent = String(cluster.count)
      const name = document.createElement('span')
      name.textContent = cluster.name
      element.append(count, name)
      const handler = () => clusterClickRef.current(cluster)
      element.addEventListener('click', handler)
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
        content: element,
        yAnchor: 1.1,
        zIndex: 10,
        clickable: true,
      })
      overlay.setMap(map)
      overlaysRef.current.push({ overlay, element, handler })
    }
  }, [clearOverlays])

  const refreshClusters = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    const sequence = ++requestSequence.current
    const bounds = map.getBounds()
    const center = map.getCenter()
    try {
      const rows = await getRegionCounts({
        level: currentLevel,
        sw: { lat: bounds.getSouthWest().getLat(), lng: bounds.getSouthWest().getLng() },
        ne: { lat: bounds.getNorthEast().getLat(), lng: bounds.getNorthEast().getLng() },
        center: { lat: center.getLat(), lng: center.getLng() },
        onlyWithCoords,
        keyword,
        theme,
      })
      if (sequence === requestSequence.current) { renderClusters(rows); setError('') }
    } catch (reason) {
      if (sequence === requestSequence.current) { clearOverlays(); setError(apiErrorMessage(reason, '지도 집계를 불러오지 못했습니다.')) }
    }
  }, [clearOverlays, currentLevel, keyword, onlyWithCoords, renderClusters, theme])

  useEffect(() => { refreshRef.current = () => { void refreshClusters() } }, [refreshClusters])

  useEffect(() => {
    let disposed = false
    let map: any
    const onZoom = () => setZoomLevel(map.getLevel())
    const onDrag = () => refreshRef.current()
    loadKakaoMaps().then(() => {
      if (disposed || !containerRef.current) return
      map = new window.kakao.maps.Map(containerRef.current, { center: new window.kakao.maps.LatLng(36.78, 126.45), level: 7 })
      mapRef.current = map
      window.kakao.maps.event.addListener(map, 'zoom_changed', onZoom)
      window.kakao.maps.event.addListener(map, 'dragend', onDrag)
      setMapReady(true)
      refreshRef.current()
    }).catch((reason) => !disposed && setError(reason instanceof Error ? reason.message : '지도를 불러오지 못했습니다.'))
    return () => {
      disposed = true
      if (map && window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(map, 'zoom_changed', onZoom)
        window.kakao.maps.event.removeListener(map, 'dragend', onDrag)
      }
      clearOverlays()
      searchMarkerRef.current?.setMap(null)
      mapRef.current = null
    }
  }, [clearOverlays])

  useEffect(() => {
    if (!mapReady) return
    const timer = window.setTimeout(() => refreshRef.current(), 300)
    return () => window.clearTimeout(timer)
  }, [mapReady, currentLevel, onlyWithCoords, keyword, theme])

  const loadSigList = async () => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds(); const center = map.getCenter()
    setSigList(await getRegionCounts({ level: 'sig', sw: { lat: bounds.getSouthWest().getLat(), lng: bounds.getSouthWest().getLng() }, ne: { lat: bounds.getNorthEast().getLat(), lng: bounds.getNorthEast().getLng() }, center: { lat: center.getLat(), lng: center.getLng() }, onlyWithCoords, keyword, theme }))
  }
  const loadEmdList = async (sig: Cluster) => setEmdList(await getRegionCounts({ level: 'emd', parentCode: sig.code, onlyWithCoords, keyword, theme }))
  const loadCategory = async (emd: Cluster) => {
    const [counts, listings] = await Promise.all([getNearbyBizCounts({ code: emd.code }), getListingsByRegion({ code: emd.code, level: 'emd', limit: 20 })])
    setBizCounts(counts.counts); setRegionListings(listings)
  }

  clusterClickRef.current = (cluster) => {
    setPanelOpen(true)
    const map = mapRef.current
    if (cluster.level === 'sig') {
      setSelectedSig(cluster); setPanelStep('emd')
      void loadEmdList(cluster).catch((reason) => setError(apiErrorMessage(reason)))
    } else {
      setSelectedEmd(cluster); setPanelStep('category')
      void loadCategory(cluster).catch((reason) => setError(apiErrorMessage(reason)))
    }
    map?.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng))
  }

  const searchPlace = () => {
    const map = mapRef.current
    if (!map || !keyword.trim() || !window.kakao?.maps?.services) return
    const places = new window.kakao.maps.services.Places()
    places.keywordSearch(keyword.trim(), (results: Array<{ x: string; y: string }>, status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !results.length) return setError('검색 결과가 없습니다.')
      const position = new window.kakao.maps.LatLng(Number(results[0].y), Number(results[0].x))
      map.setLevel(4); map.setCenter(position); searchMarkerRef.current?.setMap(null)
      searchMarkerRef.current = new window.kakao.maps.Marker({ position, map })
    })
  }

  return <div className="relative full-bleed"><form onSubmit={(event) => { event.preventDefault(); searchPlace() }} className="absolute left-1/2 top-3 z-30 flex w-[min(94vw,900px)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl bg-white/95 p-2 shadow"><label className="inline-flex items-center gap-1 px-2 text-sm"><input type="checkbox" checked={onlyWithCoords} onChange={(event) => setOnlyWithCoords(event.target.checked)} />좌표 매물만</label><input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="input min-w-0 flex-1" placeholder="지역·건물·학교 검색" /><button className="btn-primary">검색</button><select value={theme} onChange={(event) => setTheme(event.target.value)} className="input w-auto"><option value="">테마 전체</option><option>역세권</option><option>먹자골목</option><option>대학가</option></select><button type="button" className="btn-outline" onClick={() => { setPanelOpen(true); setPanelStep('sig'); void loadSigList().catch((reason) => setError(apiErrorMessage(reason))) }}>지역 목록</button></form>{error && <div className="absolute left-1/2 top-28 z-30 -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-sm text-rose-600 shadow">{error}</div>}<div ref={containerRef} className="h-[calc(100dvh-68px)] w-screen bg-slate-100" /><MapRightPanel open={panelOpen} onClose={() => setPanelOpen(false)} step={panelStep} sigRegions={sigList} onSelectSig={(sig) => clusterClickRef.current(sig)} selectedSig={selectedSig} emdRegions={emdList} onBackToSig={() => { setPanelStep('sig'); setSelectedSig(null); void loadSigList() }} onSelectEmd={(emd) => clusterClickRef.current(emd)} selectedEmd={selectedEmd ? { name: selectedEmd.name, code: selectedEmd.code } : null} bizCounts={bizCounts} listings={regionListings} onBackToEmd={() => setPanelStep(selectedSig ? 'emd' : 'sig')} /></div>
}
