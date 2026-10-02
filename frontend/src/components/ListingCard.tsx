import { Link } from 'react-router-dom'
import type { Listing } from '../services/api'

export default function ListingCard({ item }: { item: Listing }) {
  const price = item.type === 'MONTHLY'
    ? `보증금 ${(item.deposit ?? 0).toLocaleString()} / 월세 ${(item.rentMonthly ?? 0).toLocaleString()}만원`
    : `${item.type === 'SALE' ? '매매' : '전세'} ${(item.price ?? 0).toLocaleString()}만원`
  return <Link to={`/listings/${item.id}`} className="block card overflow-hidden hover:shadow-lg transition">
    {item.images[0] && (
  <div
    className="h-40 bg-gray-100 bg-cover bg-center"
    style={{ backgroundImage: `url(${item.images[0]})` }}
  />
)}
    <div className="p-4"><div className="font-semibold">{item.title}</div><div className="text-xs text-gray-500">{item.region ? `${item.region} · ` : ''}{item.address}</div><div className="text-sm mt-2">{price}{item.area ? ` · ${item.area}㎡` : ''}</div></div>
  </Link>
}
