import { useState } from 'react'
import Card from '../components/Card'
import { aiCompare, apiErrorMessage, type CompareResponse } from '../services/api'

export default function Compare() {
  const [a, setA] = useState('부춘동'); const [b, setB] = useState('동문1동')
  const [result, setResult] = useState<CompareResponse | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const run = async () => { if (!a.trim() || !b.trim()) return setError('비교할 두 지역을 입력해 주세요.'); setBusy(true); setError(''); try { setResult(await aiCompare(a.trim(), b.trim())) } catch (reason) { setError(apiErrorMessage(reason)) } finally { setBusy(false) } }
  return <div className="center-col px-4 py-6"><Card><h1 className="font-semibold mb-3">지역 비교</h1><div className="grid sm:grid-cols-3 gap-3"><label className="text-sm">지역 A<input value={a} onChange={(event) => setA(event.target.value)} className="input mt-1" /></label><label className="text-sm">지역 B<input value={b} onChange={(event) => setB(event.target.value)} className="input mt-1" /></label><button className="btn-primary self-end" disabled={busy} onClick={() => void run()}>{busy ? '분석 중…' : '분석'}</button></div>{error && <div className="mt-3 text-sm text-rose-600">{error}</div>}{result && <div className="mt-4 text-sm space-y-2"><div>유동 참고지표: A {result.A.footTraffic} / B {result.B.footTraffic}</div><div>등록 매물 수: A {result.A.competition} / B {result.B.competition}</div><div>월세 ㎡당 중앙값: A {result.A.rentIndex ?? '-'} / B {result.B.rentIndex ?? '-'}</div><div>{result.summary}</div><div className="text-xs text-gray-500">방식: {result.method}</div></div>}</Card></div>
}
