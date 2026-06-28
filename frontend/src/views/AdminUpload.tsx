import { useState } from 'react'
import Card from '../components/Card'
import { adminUploadCSV, apiErrorMessage, type AdminCsvUploadResult } from '../services/api'

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [adminKey, setAdminKey] = useState('')
  const [report, setReport] = useState<AdminCsvUploadResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async (mode: 'preview' | 'commit') => {
    if (!file || !adminKey.trim() || busy) return
    setBusy(true); setError(''); setReport(null)
    try { setReport(await adminUploadCSV(file, { mode, adminKey: adminKey.trim() })) }
    catch (reason) { setError(apiErrorMessage(reason, 'CSV를 처리하지 못했습니다.')) }
    finally { setBusy(false) }
  }

  return <div className="center-col px-4 py-6"><Card><h1 className="font-semibold mb-2">CSV 업로드(관리자)</h1><p className="text-xs text-gray-500 mb-3">최대 2MB·500건. 헤더: title,address,region,category,type,price,deposit,rentMonthly,area,images,theme,lat,lng</p><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">관리자 키<input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} className="input mt-1" autoComplete="off" /></label><label className="text-sm">CSV 파일<input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} className="input mt-1" /></label></div><div className="mt-3 flex gap-2"><button className="btn-outline" disabled={busy || !file || !adminKey.trim()} onClick={() => void upload('preview')}>검증만</button><button className="btn-primary" disabled={busy || !file || !adminKey.trim()} onClick={() => void upload('commit')}>{busy ? '처리 중…' : '등록하기'}</button></div>{error && <div className="mt-3 text-sm text-rose-600">{error}</div>}{report && <div className="mt-3 text-sm"><div>총 {report.total}건 / 성공 {report.success} / 실패 {report.failed}</div>{report.errors.length > 0 && <ul className="list-disc pl-5 mt-2">{report.errors.map((item) => <li key={`${item.line}-${item.message}`}>{item.line}행: {item.message}</li>)}</ul>}</div>}</Card></div>
}
