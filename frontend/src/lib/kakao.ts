declare global { interface Window { kakao: any } }

let pending: Promise<void> | null = null

export function loadKakaoMaps() {
  if (window.kakao?.maps) return Promise.resolve()
  if (pending) return pending
  const key = import.meta.env.VITE_KAKAO_API_KEY?.trim()
  if (!key) return Promise.reject(new Error('카카오 지도 키가 설정되지 않았습니다.'))

  pending = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('#kakao-maps-sdk')
    const script = existing || document.createElement('script')
    const timeout = window.setTimeout(() => reject(new Error('카카오 지도 로딩 시간이 초과되었습니다.')), 10_000)
    const finish = () => {
      window.clearTimeout(timeout)
      if (!window.kakao?.maps) return reject(new Error('카카오 지도 SDK를 초기화하지 못했습니다.'))
      window.kakao.maps.load(resolve)
    }
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', () => {
      window.clearTimeout(timeout)
      reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
    }, { once: true })
    if (!existing) {
      script.id = 'kakao-maps-sdk'
      script.async = true
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${encodeURIComponent(key)}&libraries=services,clusterer`
      document.head.appendChild(script)
    }
  }).catch((error) => {
    pending = null
    throw error
  })
  return pending
}
