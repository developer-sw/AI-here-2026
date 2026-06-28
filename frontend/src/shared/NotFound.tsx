import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="center-col p-8 text-center"><h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1><p className="mt-2 text-gray-600">주소를 다시 확인해 주세요.</p><Link to="/" className="btn-primary mt-4">홈으로</Link></div>
}
