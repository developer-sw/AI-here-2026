// src/views/Home.tsx
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div
      className="
        relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]
        w-screen min-h-screen overflow-x-hidden
        snap-y snap-mandatory
      "
    >
      {/* 1) HERO ─ 데이터로 검증된 창업 인사이트 */}
      <section
  className="
    snap-start min-h-screen flex items-center justify-center
    px-6 text-center
    bg-[radial-gradient(900px_520px_at_0%_100%,rgba(0,36,255,.28)_0%,rgba(0,36,255,.16)_38%,transparent_70%),radial-gradient(900px_520px_at_100%_100%,rgba(0,36,255,.28)_0%,rgba(0,36,255,.16)_38%,transparent_70%),radial-gradient(1200px_600px_at_50%_-12%,#ECF3FF_0%,transparent_60%),linear-gradient(180deg,#F3F7FF_0%,#E7EEFF_45%,#DCE6FF_100%)]
  "
>
        <div className="max-w-5xl mx-auto -mt-8 md:-mt-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black text-white text-[13px] font-semibold shadow-sm">
            <span>🚀</span>
            <span>등록 매물 기반 상권 탐색 플랫폼</span>
          </div>
<br/><br/>
            <h1 className="mt-7 leading-[1.1] font-extrabold tracking-tight text-slate-900">
            <span className="block text-[38px] sm:text-[44px] md:text-[69px] tracking-[-0.05em] md:tracking-[-0.05em]">
              데이터와 가정을 구분한
            </span>
            {/* 3) 두 줄 사이 간격 살짝 넓히기 */}
    <span className="mt-2 block text-[48px] sm:text-[56px] md:text-[66px] tracking-[-0.05em] md:tracking-[-0.05em]
                     bg-clip-text text-transparent
                     bg-[linear-gradient(90deg,#3B82F6_0%,#6366F1_50%,#8B5CF6_100%)]">
      창업 참고 인사이트
    </span>
          </h1>
<br/>
          <p className="mt-7 text-[15px] md:text-lg text-slate-600 max-w-3xl mx-auto">
            등록 매물, 선택적 지도 데이터, 공개된 계산 가정을 이용해<br className="hidden md:inline" />
            입지와 비용 조건을 비교할 수 있습니다
          </p>
<br/>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/ai"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-black text-white text-[15px] font-semibold ring-1 ring-black/10 shadow-sm hover:brightness-110 transition"
              aria-label="상권 분석 시작하기(기존 AI 메이트)"
            >
              상권 분석 시작하기
            </Link>

            <Link
              to="/wizard"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-white text-slate-900 text-[15px] font-semibold ring-1 ring-slate-300 shadow-sm hover:bg-slate-50 hover:ring-slate-400 transition"
              aria-label="AI 창업 가이드(기존 AI 추천)"
            >
              AI 창업 가이드
            </Link>
          </div>
        </div>
      </section>

      {/* 2) WHY ─ 왜 AI 여긴어때 인가요? (로고와 동일한 스타일로 변경) */}
      <section className="snap-start min-h-screen flex items-center px-6 bg-[#F5F9FF]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              왜{' '}
              <span
                className="
                  font-line-seed logo-strong
                  text-transparent bg-clip-text bg-gradient-to-r
                  from-[#ff5bf1] to-[#79e4ff]
                  drop-shadow-[0_6px_24px_rgba(121,228,255,.18)]
                "
              >
                AI 여긴어때
              </span>{' '}
              인가요?<br/>
            </h2>
            <p className="mt-3 text-slate-600">
              실제 등록 데이터와 참고용 휴리스틱을 명확히 구분하고,<br/> 결과의 계산 방식을 함께 표시합니다.<br/><br/><br/><br/><br/>
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-sky-600">
                  <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="11" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
              title="지도 기반 매물 탐색"
              desc="등록 매물의 좌표와 지역 정보를 이용해 위치별 매물 분포를 탐색합니다"
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-sky-600">
                  <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="6" y="12" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
                  <rect x="11" y="9" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
                  <rect x="16" y="6" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
                </svg>
              }
              title="투명한 손익 계산"
              desc="면적, 월세, 인건비, 원가율을 입력하고 같은 가정으로 예상 손익과 BEP를 비교합니다"
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-sky-600">
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              }
              title="로그인 없는 개인 공간"
              desc="브라우저 방문자 키로 내 매물, 리뷰, 즐겨찾기를 한 곳에서 관리합니다"
            />
          </div>
        </div>
      </section>

      {/* 3) CTA BAND */}
      <section
        className="
          snap-start min-h-[50vh] flex items-center justify-center text-center px-6
          bg-[linear-gradient(135deg,#4F46E5_0%,#7C3AED_50%,#06B6D4_100%)]
          text-white
        "
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-extrabold leading-snug">
            내 조건으로 상권과 비용을 비교해 보세요
          </h3>
          <p className="mt-4 text-white/90">
            결과는 참고값이며, 데이터가 없는 경우 임의의 수치를 만들어 표시하지 않습니다
          </p>
          <div className="mt-8">
            <Link
              to="/ai"
              className="inline-flex items-center px-6 h-12 rounded-xl bg-white text-slate-900 font-semibold shadow hover:bg-white/90 transition"
            >
              무료로 분석 시작하기
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

/* helpers */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
      <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-4 font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  )
}
