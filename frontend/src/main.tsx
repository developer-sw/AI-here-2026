import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense
      fallback={(
        <div
          className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          페이지를 불러오는 중…
        </div>
      )}
    >
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </Suspense>
  </React.StrictMode>,
)
