// src/shared/MainLayout.tsx
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const nav = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex items-center h-10 px-3 rounded-xl',
    'text-sm transition-colors',
    isActive
      ? 'bg-white text-brand-700 shadow-soft font-semibold'
      : 'text-gray-700 hover:bg-white/70 font-normal',
  ].join(' ')

export default function MainLayout() {
  const location = useLocation()

const hideFooter =
  location.pathname.startsWith('/account') ||
  location.pathname.startsWith('/ai/chat')

  // 홈/지도 상단 여백 미세 보정
  const isHome = location.pathname === '/'
  const isMap  = location.pathname.startsWith('/map')
  const tightTopClass = isHome || isMap ? '-mt-px' : ''

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단바: 홈에서도 항상 표시 */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
        {/* 풀폭 컨테이너 + 좌측 그룹 / 우측 마이페이지 */}
        <div className="w-full max-w-none px-3 sm:px-4 md:px-6 py-3 flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            {/* 로고 */}
            <Link
              to="/"
              aria-label="AI여긴어때 홈"
              className="group flex items-end gap-1.5 select-none whitespace-nowrap"
            >
              <span
                className={[
                  'ml-1 font-line-seed logo-strong leading-none',
                  'text-[26px] sm:text-[34px] md:text-[42px]',
                  'text-transparent bg-clip-text bg-gradient-to-r',
                  'from-[#ff5bf1] to-[#79e4ff]',
                  'drop-shadow-[0_6px_24px_rgba(121,228,255,.18)]',
                ].join(' ')}
              >
                AI여긴어때
              </span>
            </Link>

            {/* 네비게이션 */}
            <nav className="flex min-w-0 items-center gap-1 no-scrollbar overflow-x-auto">
              <NavLink to="/ai" className={nav}>AI 메이트</NavLink>
              <NavLink to="/map" className={nav}>지도</NavLink>
              {/* /listings 정확 매칭만 활성화 (listings/new 클릭 시 공실 매물 비활성) */}
              <NavLink to="/listings" end className={nav}>공실 매물</NavLink>
              <NavLink to="/support" className={nav}>창업 지원</NavLink>
              <NavLink to="/listings/new" className={nav}>매물 등록</NavLink>
              <NavLink to="/more" className={nav}>더보기</NavLink>
            </nav>
          </div>

          {/* 우측: 마이페이지 */}
          <div className="ml-auto shrink-0">
            <Link to="/account" className="text-sm text-gray-700">마이페이지</Link>
          </div>
        </div>
      </header>

      {/* 페이지 콘텐츠 */}
      <main className={`pt-0 pb-8 ${tightTopClass}`}>
        {/* 첫 컴포넌트가 margin-top을 가지고 있어도 헤더와 틈이 생기지 않도록 */}
        <div className="first:mt-0">
          <Outlet />
        </div>
      </main>

      {/* 마이페이지 외에는 푸터 노출 */}
      {!hideFooter && (
        <footer className="border-t py-8 text-center text-sm text-gray-500 bg-white">
          © {new Date().getFullYear()} AI여긴어때
        </footer>
      )}
    </div>
  )
}
