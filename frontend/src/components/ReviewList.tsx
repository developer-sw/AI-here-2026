import { useEffect, useState } from 'react'
import { addReview, apiErrorMessage, deleteReview, getReviews, updateReview, type Review } from '../services/api'

export default function ReviewList({ listingId }: { listingId: string }) {
  const [items, setItems] = useState<Review[]>([])
  const [text, setText] = useState('')
  const [nickname, setNickname] = useState('')
  const [rating, setRating] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getReviews(listingId).then((rows) => active && setItems(rows)).catch((reason) => active && setError(apiErrorMessage(reason)))
    return () => { active = false }
  }, [listingId])

  const submit = async () => {
    if (!text.trim() || busy) return
    setBusy(true); setError('')
    try {
      const created = await addReview(listingId, { text: text.trim(), nickname: nickname.trim() || undefined, rating })
      setItems((current) => [created, ...current]); setText(''); setNickname(''); setRating(undefined)
    } catch (reason) { setError(apiErrorMessage(reason, '리뷰를 등록하지 못했습니다.')) }
    finally { setBusy(false) }
  }

  const edit = async (review: Review) => {
    const value = window.prompt('수정할 리뷰를 입력하세요.', review.text)?.trim()
    if (!value) return
    try {
      const updated = await updateReview(listingId, review.id, { text: value, rating: review.rating })
      setItems((current) => current.map((item) => item.id === review.id ? updated : item))
    } catch (reason) { setError(apiErrorMessage(reason, '리뷰를 수정하지 못했습니다.')) }
  }

  const remove = async (review: Review) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return
    try { await deleteReview(listingId, review.id); setItems((current) => current.filter((item) => item.id !== review.id)) }
    catch (reason) { setError(apiErrorMessage(reason, '리뷰를 삭제하지 못했습니다.')) }
  }

  return <div><h2 className="text-lg font-semibold">매물 리뷰</h2><div className="mt-3 p-3 rounded-xl border bg-white space-y-2"><div className="grid sm:grid-cols-[1fr_auto] gap-2"><input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="닉네임(선택)" className="input" maxLength={30} /><select value={rating ?? ''} onChange={(event) => setRating(event.target.value ? Number(event.target.value) : undefined)} className="input sm:w-32"><option value="">평점 없음</option>{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="리뷰를 입력하세요." rows={3} maxLength={1000} className="input min-h-24" /><div className="flex justify-between text-xs text-gray-500"><span>{text.length}/1000</span><button className="btn-primary" disabled={busy || !text.trim()} onClick={() => void submit()}>{busy ? '등록 중…' : '등록'}</button></div></div>{error && <div className="mt-2 text-sm text-rose-600">{error}</div>}<div className="mt-4 space-y-3">{items.map((review) => <div key={review.id} className="p-3 rounded-xl border bg-white"><div className="flex text-sm"><b>{review.nickname || '익명'}</b>{review.rating && <span className="ml-2 text-amber-500">★ {review.rating}</span>}<span className="ml-auto text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}</span></div><p className="mt-2 whitespace-pre-wrap">{review.text}</p>{review.canEdit && <div className="mt-2 flex gap-2"><button className="btn-outline" onClick={() => void edit(review)}>수정</button><button className="btn-outline text-rose-600" onClick={() => void remove(review)}>삭제</button></div>}</div>)}{!items.length && <div className="text-sm text-gray-500">아직 작성된 리뷰가 없습니다.</div>}</div></div>
}
