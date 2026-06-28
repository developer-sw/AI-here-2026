import { useMemo, useState } from 'react'
import { apiErrorMessage, createListing, deleteListing, getMyListings, type NewListingPayload, type Listing, type TradeType } from '../services/api'
import { ensureAuthKey, maskKey } from '../lib/auth'

const EMPTY_FORM = {
  title: '', description: '', address: '', region: '', category: '', imagesText: '',
  type: 'SALE' as TradeType, price: '', deposit: '', rentMonthly: '', maintenanceFee: '', area: '',
  lat: '', lng: '', phone: '', availableFrom: '',
}

const numberOrUndefined = (value: string) => value.trim() === '' ? undefined : Number(value)

export default function ListingCreate() {
  const ownerKey = useMemo(() => ensureAuthKey(), [])
  const [tab, setTab] = useState<'create' | 'manage'>('create')
  const [form, setForm] = useState(EMPTY_FORM)
  const [myItems, setMyItems] = useState<Listing[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const update = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async () => {
    if (busy) return
    const images = form.imagesText.split('\n').map((value) => value.trim()).filter(Boolean)
    const payload: NewListingPayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      address: form.address.trim(),
      region: form.region.trim() || undefined,
      category: form.category,
      images,
      type: form.type,
      price: form.type === 'MONTHLY' ? undefined : numberOrUndefined(form.price),
      deposit: form.type === 'MONTHLY' ? numberOrUndefined(form.deposit) : undefined,
      rentMonthly: form.type === 'MONTHLY' ? numberOrUndefined(form.rentMonthly) : undefined,
      maintenanceFee: numberOrUndefined(form.maintenanceFee),
      area: numberOrUndefined(form.area),
      lat: numberOrUndefined(form.lat),
      lng: numberOrUndefined(form.lng),
      phone: form.phone.trim() || undefined,
      availableFrom: form.availableFrom || undefined,
    }
    setBusy(true)
    setMessage(null)
    try {
      const created = await createListing(payload, ownerKey)
      setMessage({ kind: 'success', text: `매물 “${created.title}”을 등록했습니다.` })
      setForm(EMPTY_FORM)
    } catch (error) {
      setMessage({ kind: 'error', text: apiErrorMessage(error, '매물을 등록하지 못했습니다.') })
    } finally {
      setBusy(false)
    }
  }

  const loadMine = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const response = await getMyListings(ownerKey)
      setMyItems(response.items)
    } catch (error) {
      setMessage({ kind: 'error', text: apiErrorMessage(error, '내 매물을 불러오지 못했습니다.') })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    setBusy(true)
    try {
      await deleteListing(id, ownerKey)
      setMyItems((items) => items.filter((item) => item.id !== id))
      setMessage({ kind: 'success', text: '매물을 삭제했습니다.' })
    } catch (error) {
      setMessage({ kind: 'error', text: apiErrorMessage(error, '매물을 삭제하지 못했습니다.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-col px-3 py-6">
      <h1 className="text-2xl font-bold mb-4">매물 등록 / 관리</h1>
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-sm font-semibold">내 관리 키</div>
          <code className="text-xs">{maskKey(ownerKey)}</code>
        </div>
        <button className="btn-outline ml-auto" onClick={() => navigator.clipboard.writeText(ownerKey)}>키 복사</button>
        <p className="w-full text-xs text-gray-500">이 브라우저의 방문자 키 하나로 매물·리뷰·즐겨찾기를 관리합니다.</p>
      </div>

      <div className="flex gap-2 mb-3">
        <button className={tab === 'create' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('create')}>매물 등록</button>
        <button className={tab === 'manage' ? 'btn-primary' : 'btn-outline'} onClick={() => { setTab('manage'); void loadMine() }}>내 매물 관리</button>
      </div>

      {message && <div className={`mb-3 text-sm ${message.kind === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{message.text}</div>}

      {tab === 'create' ? (
        <div className="card p-4 space-y-5">
          <section className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">제목<input required value={form.title} onChange={(event) => update('title', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm">카테고리
              <select required value={form.category} onChange={(event) => update('category', event.target.value)} className="input mt-1">
                <option value="">선택하세요</option>
                {['카페/디저트','식당','주점/호프','편의','패션/액세서리','뷰티/미용','의료/약국','문화/취미','레저/스포츠','사무/공유오피스','숙박','창고/물류','팝업/쇼룸','기타'].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm md:col-span-2">설명<textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="input mt-1 min-h-24" maxLength={3000} /></label>
            <label className="text-sm md:col-span-2">주소<input required value={form.address} onChange={(event) => update('address', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm">지역명<input value={form.region} onChange={(event) => update('region', event.target.value)} className="input mt-1" placeholder="예: 부춘동" /></label>
            <label className="text-sm">거래 유형
              <select value={form.type} onChange={(event) => update('type', event.target.value)} className="input mt-1">
                <option value="SALE">매매</option><option value="JEONSE">전세</option><option value="MONTHLY">월세</option>
              </select>
            </label>
          </section>

          <section className="grid sm:grid-cols-3 gap-3">
            {form.type !== 'MONTHLY' ? (
              <label className="text-sm">{form.type === 'SALE' ? '매매가' : '전세보증금'}(만원)<input type="number" min="0" required value={form.price} onChange={(event) => update('price', event.target.value)} className="input mt-1" /></label>
            ) : <>
              <label className="text-sm">보증금(만원)<input type="number" min="0" required value={form.deposit} onChange={(event) => update('deposit', event.target.value)} className="input mt-1" /></label>
              <label className="text-sm">월세(만원)<input type="number" min="0" required value={form.rentMonthly} onChange={(event) => update('rentMonthly', event.target.value)} className="input mt-1" /></label>
            </>}
            <label className="text-sm">관리비(만원)<input type="number" min="0" value={form.maintenanceFee} onChange={(event) => update('maintenanceFee', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm">면적(㎡)<input type="number" min="0" value={form.area} onChange={(event) => update('area', event.target.value)} className="input mt-1" /></label>
          </section>

          <section className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">위도<input type="number" step="any" value={form.lat} onChange={(event) => update('lat', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm">경도<input type="number" step="any" value={form.lng} onChange={(event) => update('lng', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm">연락처<input value={form.phone} onChange={(event) => update('phone', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm">입주 가능일<input type="date" value={form.availableFrom} onChange={(event) => update('availableFrom', event.target.value)} className="input mt-1" /></label>
            <label className="text-sm md:col-span-2">이미지 URL — 한 줄에 하나<textarea value={form.imagesText} onChange={(event) => update('imagesText', event.target.value)} className="input mt-1 min-h-24" /></label>
          </section>
          <button disabled={busy} className="btn-primary" onClick={() => void submit()}>{busy ? '처리 중…' : '등록하기'}</button>
        </div>
      ) : (
        <div className="card p-4">
          <div className="flex items-center mb-3"><h2 className="font-semibold">내가 등록한 매물</h2><button className="btn-outline ml-auto" disabled={busy} onClick={() => void loadMine()}>새로고침</button></div>
          {!myItems.length && !busy && <div className="text-sm text-gray-500">등록한 매물이 없습니다.</div>}
          <div className="space-y-2">
            {myItems.map((item) => <div key={item.id} className="border rounded-xl p-3 flex items-center gap-3"><div><div className="font-medium">{item.title}</div><div className="text-xs text-gray-500">{item.address}</div></div><button className="btn-outline ml-auto text-rose-600" disabled={busy} onClick={() => void remove(item.id)}>삭제</button></div>)}
          </div>
        </div>
      )}
    </div>
  )
}
