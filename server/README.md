# Express API

## 주요 경로

- `GET /api/health`
- `GET|POST /api/listings`
- `GET|PUT|DELETE /api/listings/:id`
- `GET /api/listings/mine`
- `GET|POST /api/listings/:id/reviews`
- `PUT|DELETE /api/listings/:id/reviews/:reviewId`
- `GET|POST /api/favorites`, `GET|DELETE /api/favorites/:id`
- `POST /api/ai/recommend|simulate|compare|market-analysis|chat`
- `GET /api/map/count-by-level|nearby-biz-counts|listings-by-region`
- `GET /api/stats/nearby`
- `POST /api/admin/upload-csv`

매물·리뷰·즐겨찾기 쓰기에는 `X-Owner-Key`, CSV 업로드에는 `X-Admin-Key`가 필요합니다. 소유자 키는 SHA-256 해시로만 저장되고 공개 응답에서는 제거됩니다.

JSON 저장은 프로세스 내에서 직렬화되며 임시 파일을 거쳐 원자적으로 교체됩니다. 여러 서버 인스턴스나 대규모 운영 환경에서는 관계형 DB 등 외부 저장소로 교체해야 합니다.
