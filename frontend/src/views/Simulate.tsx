import { useState } from 'react'
import Card from '../components/Card'
import { aiSimulate, apiErrorMessage, type SimulationResponse } from '../services/api'

export default function Simulate() {
  const [form, setForm] = useState({ region: '부춘동', category: '카페', area: 70, rent: 250, cogsRate: 0.35, labor: 350, misc: 120 })
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setNumber = (key: 'area' | 'rent' | 'cogsRate' | 'labor' | 'misc', value: string) => setForm((current) => ({ ...current, [key]: Number(value) }))
  const run = async () => {
    if (busy) return
    if (form.area <= 0 || form.rent < 0 || form.labor < 0 || form.misc < 0 || form.cogsRate < 0 || form.cogsRate >= 1) return setError('면적·비용·원가율을 올바르게 입력해 주세요.')
    setBusy(true); setError('')
    try { setResult(await aiSimulate(form)) } catch (reason) { setError(apiErrorMessage(reason)) } finally { setBusy(false) }
  }
  return <div className="center-col px-4 py-6"><Card><h1 className="font-semibold mb-3">손익분기점 참고 계산</h1><div className="grid sm:grid-cols-3 gap-3"><label className="text-sm">지역<input className="input mt-1" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} /></label><label className="text-sm">업종<input className="input mt-1" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>{(['area','rent','cogsRate','labor','misc'] as const).map((key) => <label key={key} className="text-sm">{key}<input type="number" step={key === 'cogsRate' ? '0.01' : '1'} min="0" className="input mt-1" value={form[key]} onChange={(event) => setNumber(key, event.target.value)} /></label>)}</div><button className="btn-primary mt-3" disabled={busy} onClick={() => void run()}>{busy ? '계산 중…' : '계산'}</button>{error && <div className="mt-3 text-sm text-rose-600">{error}</div>}{result && <div className="mt-3 text-sm"><div>예상 매출: {result.estimatedSales.toLocaleString()}만원</div><div>영업이익: {result.operatingProfit.toLocaleString()}만원</div><div>BEP 매출: {result.bepSales?.toLocaleString() ?? '-'}만원</div><div className="mt-1 text-xs text-gray-500">방식: {result.method}</div></div>}</Card></div>
}
