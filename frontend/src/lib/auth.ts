const COOKIE_KEY = 'sv_auth'
const LOCAL_KEY = 'svai-auth-key'
const ONE_YEAR = 60 * 60 * 24 * 365

function setCookie(name: string, value: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax${secure}`
}

function getCookie(name: string) {
  const raw = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1)
  if (!raw) return undefined
  try { return decodeURIComponent(raw) } catch { return undefined }
}

function readLocal() {
  try { return window.localStorage.getItem(LOCAL_KEY) || undefined } catch { return undefined }
}

function writeLocal(value: string) {
  try { window.localStorage.setItem(LOCAL_KEY, value) } catch { /* 저장소가 막혀도 쿠키는 유지 */ }
}

function randomKey(length = 32) {
  const bytes = new Uint8Array(length)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

export function ensureAuthKey() {
  const value = getCookie(COOKIE_KEY) || readLocal() || randomKey()
  setCookie(COOKIE_KEY, value)
  writeLocal(value)
  return value
}

export function maskKey(key: string, prefix = 6) {
  return key ? `${key.slice(0, prefix)}•••` : ''
}
