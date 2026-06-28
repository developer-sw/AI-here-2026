import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import { aiMarketAnalysis, apiErrorMessage, type MarketAnalysisRequest, type MarketAnalysisResponse } from '../services/api'

export default function WizardResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { params?: MarketAnalysisRequest } | null
  const [params, setParams] = useState<MarketAnalysisRequest | null>(null)
  const [result, setResult] = useState<MarketAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let request = state?.params || null
    if (!request) {
      try { request = JSON.parse(sessionStorage.getItem('wizard.params') || 'null') as MarketAnalysisRequest | null }
      catch { request = null }
    }
    if (!request) { navigate('/wizard', { replace: true }); return }
    setParams(request); setLoading(true); setError('')
    let active = true
    aiMarketAnalysis(request)
      .then((response) => { if (active) { setResult(response); sessionStorage.setItem('wizard.result', JSON.stringify(response)) } })
      .catch((reason) => active && setError(apiErrorMessage(reason, '상권 분석을 불러오지 못했습니다.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [state, navigate, retry])

  if (!params) return null
  return <div className="mx-auto px-4 w-[94vw] md:w-[80vw] xl:max-w-[980px] py-6 space-y-6"><div className="flex items-start"><div><h1 className="text-2xl font-bold">상권 분석 결과</h1><div className="text-sm text-gray-500">지역: <b>{params.location}</b> · 업종: <b>{params.industries.join(', ')}</b></div></div><button className="btn-outline ml-auto" onClick={() => navigate('/wizard')}>다시 입력</button></div>{loading && <div className="text-sm text-gray-500">분석 중…</div>}{error && <Card><div className="text-sm text-rose-600">{error}</div><button className="btn-outline mt-3" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></Card>}{!loading && !error && result && <><Card><div className="font-semibold mb-2">핵심 요약</div><p className="whitespace-pre-wrap">{result.summary}</p><div className="mt-2 text-xs text-gray-500">분석 방식: {result.method}</div></Card><div className="grid md:grid-cols-2 gap-4"><Card><div className="font-semibold mb-2">추천 업종</div><div className="flex gap-2 flex-wrap">{result.recommendedCategories?.map((category) => <span key={category} className="chip">{category}</span>)}</div></Card><Card><div className="font-semibold mb-2">매출 전망</div><div>예상 월매출: <b>{result.estimatedSales?.toLocaleString() ?? '-'}만원</b></div><div>BEP 매출: <b>{result.bepSales?.toLocaleString() ?? '-'}만원</b></div></Card></div><Card><div className="font-semibold mb-2">유망 구역</div>{result.hotZones?.map((zone) => <div key={zone.name} className="flex justify-between border rounded-xl p-3"><span>{zone.name}</span><b>{zone.score}</b></div>)}</Card><Card><div className="font-semibold mb-2">인사이트</div><ul className="list-disc pl-5">{result.insights?.map((value) => <li key={value}>{value}</li>)}</ul></Card></>}</div>
}
