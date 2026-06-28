import axios from 'axios'
import { ensureAuthKey } from '../lib/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
export const api = axios.create({ baseURL, timeout: 12_000 })

export function apiErrorMessage(error: unknown, fallback = '요청을 처리하지 못했습니다.') {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error
    if (typeof message === 'string' && message) return message
    if (error.code === 'ECONNABORTED') return '서버 응답 시간이 초과되었습니다.'
    if (!error.response) return '서버에 연결할 수 없습니다.'
  }
  return error instanceof Error && error.message ? error.message : fallback
}

const ownerHeaders = (ownerKey?: string) => ({
  headers: { 'X-Owner-Key': ownerKey || ensureAuthKey() },
})

export type TradeType = 'SALE' | 'JEONSE' | 'MONTHLY'

export type Listing = {
  id: string
  title: string
  region?: string
  address: string
  category: string
  type: TradeType
  price?: number
  deposit?: number
  rentMonthly?: number
  maintenanceFee?: number
  area?: number
  lat?: number
  lng?: number
  sido?: string
  sigungu?: string
  dong?: string
  sidoCode?: string
  sigunguCode?: string
  dongCode?: string
  images: string[]
  theme: string[]
  description?: string
  phone?: string
  availableFrom?: string
  createdAt?: string
  updatedAt?: string
  favoritesCount?: number
  reviewsCount?: number
  canEdit?: boolean
  score?: number
  competition?: number | null
  source?: string
  sourceLabel?: string
  externalUrl?: string
  pricingNote?: string
}

export type NewListingPayload = {
  title: string
  description?: string
  address: string
  region?: string
  category: string
  images: string[]
  theme?: string[]
  type: TradeType
  price?: number
  deposit?: number
  rentMonthly?: number
  maintenanceFee?: number
  area?: number
  lat?: number
  lng?: number
  sido?: string
  sigungu?: string
  dong?: string
  sidoCode?: string
  sigunguCode?: string
  dongCode?: string
  phone?: string
  availableFrom?: string
}

export type ListingsQuery = {
  q?: string
  region?: string
  category?: string
  type?: TradeType
  theme?: string
  dealType?: 'all' | 'sale' | 'jeonse' | 'wolse'
  sort?: 'price' | 'area' | 'popular' | 'newest'
  ids?: string
}

export const getListings = (params: ListingsQuery = {}) =>
  api.get<Listing[]>('/listings', { params, ...ownerHeaders() }).then((response) => response.data)

export type PublicListingsResponse = {
  available: boolean
  status: 'ok' | 'not-configured' | 'authorization-pending' | 'error'
  source: string
  items: Listing[]
  total: number
  message?: string
}

export const getLhCommercialNotices = (params?: { q?: string; page?: number; pageSize?: number; regionCode?: string }) =>
  api.get<PublicListingsResponse>('/public/lh-commercial-notices', { params }).then((response) => response.data)

export const getListing = (id: string | number) =>
  api.get<Listing>(`/listings/${encodeURIComponent(id)}`, ownerHeaders()).then((response) => response.data)

export const createListing = (body: NewListingPayload, ownerKey?: string) =>
  api.post<Listing>('/listings', body, ownerHeaders(ownerKey)).then((response) => response.data)

export const updateListing = (id: string | number, body: Partial<NewListingPayload>, ownerKey?: string) =>
  api.put<Listing>(`/listings/${encodeURIComponent(id)}`, body, ownerHeaders(ownerKey)).then((response) => response.data)

export const deleteListing = (id: string | number, ownerKey?: string) =>
  api.delete<{ ok: boolean; deleted: string }>(`/listings/${encodeURIComponent(id)}`, ownerHeaders(ownerKey))
    .then((response) => response.data)

export const getMyListings = (ownerKey?: string) =>
  api.get<{ items: Listing[] }>('/listings/mine', ownerHeaders(ownerKey)).then((response) => response.data)

export type Review = {
  id: string
  text: string
  rating?: number
  nickname?: string
  createdAt?: string
  updatedAt?: string
  canEdit?: boolean
}

export const getReviews = (listingId: string | number) =>
  api.get<Review[]>(`/listings/${encodeURIComponent(listingId)}/reviews`, ownerHeaders()).then((response) => response.data)

export const addReview = (listingId: string | number, body: { text: string; rating?: number; nickname?: string }) =>
  api.post<Review>(`/listings/${encodeURIComponent(listingId)}/reviews`, body, ownerHeaders()).then((response) => response.data)

export const updateReview = (listingId: string | number, reviewId: string, body: { text?: string; rating?: number }) =>
  api.put<Review>(`/listings/${encodeURIComponent(listingId)}/reviews/${encodeURIComponent(reviewId)}`, body, ownerHeaders())
    .then((response) => response.data)

export const deleteReview = (listingId: string | number, reviewId: string) =>
  api.delete<{ ok: true }>(`/listings/${encodeURIComponent(listingId)}/reviews/${encodeURIComponent(reviewId)}`, ownerHeaders())
    .then((response) => response.data)

export const getFavorites = (ownerKey?: string) =>
  api.get<{ items: Listing[] }>('/favorites', ownerHeaders(ownerKey)).then((response) => response.data)

export const addFavorite = (listingId: string | number, ownerKey?: string) =>
  api.post<{ ok: true }>('/favorites', { listingId }, ownerHeaders(ownerKey)).then((response) => response.data)

export const removeFavorite = (listingId: string | number, ownerKey?: string) =>
  api.delete<{ ok: true }>(`/favorites/${encodeURIComponent(listingId)}`, ownerHeaders(ownerKey)).then((response) => response.data)

export const isFavorite = (listingId: string | number, ownerKey?: string) =>
  api.get<{ isFav: boolean }>(`/favorites/${encodeURIComponent(listingId)}`, ownerHeaders(ownerKey))
    .then((response) => response.data.isFav)

export type RecommendationResponse = {
  method: string
  categories: string[]
  listings: Listing[]
  reasons: string[]
}

export const aiRecommend = (body: unknown) =>
  api.post<RecommendationResponse>('/ai/recommend', body).then((response) => response.data)

export type SimulationResponse = {
  method: string
  estimatedSales: number
  operatingProfit: number
  bepSales: number | null
  recommendedCategory: string
}

export const aiSimulate = (body: unknown) =>
  api.post<SimulationResponse>('/ai/simulate', body).then((response) => response.data)

export type CompareResponse = {
  method: string
  A: { footTraffic: number; rentIndex: number | null; competition: number; youth: number }
  B: { footTraffic: number; rentIndex: number | null; competition: number; youth: number }
  summary: string
}

export const aiCompare = (regionA: string, regionB: string) =>
  api.post<CompareResponse>('/ai/compare', { regionA, regionB }).then((response) => response.data)

export type MarketAnalysisRequest = {
  location: string
  industries: string[]
  budget: string | null
  experience: string | null
  target?: string
  analyses: string[]
}

export type MarketAnalysisResponse = {
  method: string
  summary?: string
  recommendedCategories?: string[]
  hotZones?: { name: string; score: number }[]
  estimatedSales?: number
  bepSales?: number | null
  insights?: string[]
  listings?: Listing[]
}

export const aiMarketAnalysis = (body: MarketAnalysisRequest) =>
  api.post<MarketAnalysisResponse>('/ai/market-analysis', body).then((response) => response.data)

export const aiChat = (prompt: string) =>
  api.post<{ method: string; answer: string; listings?: Listing[] }>('/ai/chat', { prompt })
    .then((response) => response.data)

export type RegionLevel = 'sig' | 'emd'
export type RegionCount = {
  code: string
  name: string
  level: RegionLevel
  lat: number
  lng: number
  count: number
  parentCode?: string
}

export type RegionCountParams = {
  level: RegionLevel
  sw?: { lat: number; lng: number }
  ne?: { lat: number; lng: number }
  center?: { lat: number; lng: number }
  parentCode?: string
  onlyWithCoords?: boolean
  keyword?: string
  theme?: string
}

export const getRegionCounts = (params: RegionCountParams) =>
  api.get<RegionCount[]>('/map/count-by-level', { params }).then((response) => response.data)

export const getNearbyBizCounts = (params: { code?: string; lat?: number; lng?: number; radius?: number }) =>
  api.get<{ counts: Record<string, number>; source: string }>('/map/nearby-biz-counts', { params })
    .then((response) => response.data)

export const getListingsByRegion = (params: { code: string; level: RegionLevel; limit?: number }) =>
  api.get<Listing[]>('/map/listings-by-region', { params }).then((response) => response.data)

export const getNearbyListingCounts = (params: { lat: number; lng: number; radius: number }) =>
  api.get<{ counts: Record<string, number>; source: string }>('/stats/nearby', { params }).then((response) => response.data)

export type SupportNews = {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  tags?: string[]
  thumbnail?: string
}

export const getSupportNews = (params?: { page?: number; pageSize?: number; q?: string; tag?: string; since?: string }) =>
  api.get<{ items: SupportNews[]; nextPage?: number; source?: string }>('/support/news', { params })
    .then((response) => response.data)

export type AdminCsvUploadResult = {
  ok: boolean
  total: number
  success: number
  failed: number
  errors: Array<{ line: number; message: string }>
  preview?: Listing[]
}

export async function adminUploadCSV(file: File, options: { mode: 'preview' | 'commit'; adminKey: string }) {
  const form = new FormData()
  form.append('file', file)
  form.append('mode', options.mode)
  const response = await api.post<AdminCsvUploadResult>('/admin/upload-csv', form, {
    headers: { 'X-Admin-Key': options.adminKey },
  })
  return response.data
}
