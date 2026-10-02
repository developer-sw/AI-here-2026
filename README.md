# 🏙️ AI여긴어때

> 공실 매물과 지역 정보를 탐색하고,  
> 창업 조건에 따라 입지·비용을 비교할 수 있도록 만든 **상권·공실 탐색 웹 서비스**입니다.

이 프로젝트는 **2025 멋쟁이사자처럼 중앙해커톤**에서 시작되었습니다.

해커톤 당시에는 Frontend를 단독으로 담당했으며,  
대회 종료 이후 프로젝트를 개인적으로 계속 수정하면서  
현재는 React 기반 Frontend와 Express API Server를 함께 포함하는 형태로 발전시켰습니다.

---

## Project Overview

- **Project:** AI여긴어때
- **Origin:** 2025 멋쟁이사자처럼 중앙해커톤
- **Hackathon Role:** Frontend 단독 담당
- **Current Status:** 해커톤 이후 개인적으로 개선한 버전
- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS
- **Server:** Node.js · Express
- **Structure:** npm Workspaces 기반 Frontend / Server Monorepo

---

## Project History

이 저장소는 **해커톤 당시 결과물과 현재 코드의 상태가 동일하지 않습니다.**

### 1. 2025 Central Hackathon

2025 멋쟁이사자처럼 중앙해커톤에서  
프로젝트의 **Frontend를 단독으로 담당했습니다.**

당시에는 Frontend 개발 경험이 많지 않은 상태에서  
페이지 구성과 화면 구현을 진행했습니다.

하지만 Frontend와 Backend를 연결하는 방법에 대한 이해가 부족했고,  
제한된 해커톤 일정 안에서 **팀 Backend와의 실제 API 연동까지 완료하지 못했습니다.**

따라서 대회 당시 서비스는 전체적으로 완성된 상태까지 도달하지 못했습니다.

### 2. Initial Server Code

해커톤 중 API 연동을 시도하는 과정에서  
생성형 AI의 도움을 받아 Frontend와 연결하기 위한 별도의 Express Server 코드가 만들어졌습니다.

이 Server는 **해커톤 Backend 팀원이 개발한 코드가 아니며**,  
당시 팀에서 사용하려던 실제 Backend 구현과도 별개의 코드입니다.

### 3. Post-hackathon Personal Development

해커톤이 끝난 이후에도 프로젝트를 그대로 두지 않고  
개인적으로 Frontend와 Server를 조금씩 수정하고 보완했습니다.

현재 저장소에는 당시 해커톤 버전보다 다음과 같은 내용이 추가되어 있습니다.

- TypeScript 기반 Frontend 구조 정리
- React Router 기반 페이지 Routing
- Axios API Layer 구성
- 공통 Layout 및 UI Component 분리
- 공실 매물 등록·조회·관리 기능
- 리뷰 및 즐겨찾기 기능
- 지도 기반 매물 탐색
- 창업 조건 기반 참고 분석
- Express API Server
- 입력 검증 및 간단한 요청 권한 처리
- JSON 기반 데이터 저장
- Server Test 코드

> 현재 공개 저장소는 해커톤 종료 이후 별도로 정리한 버전이며,  
> 해커톤 당시의 개발 과정을 Git commit history가 그대로 보존하고 있지는 않습니다.

---

<!--
## Screenshots

추후 실제 실행 화면을 추가할 예정입니다.

예시 파일 구조:

docs/images/
├─ home.png
├─ listings.png
├─ map.png
├─ wizard.png
├─ ai-chat.png
└─ listing-detail.png
-->

## Service

AI여긴어때는 공실 매물을 탐색하면서  
지역과 창업 조건을 함께 비교할 수 있도록 구성한 서비스입니다.

현재 저장소 기준 주요 기능은 다음과 같습니다.

### 공실 매물 탐색

- 등록된 공실 매물 조회
- 키워드 / 지역 / 업종 검색
- 매매 / 전세 / 월세 조건 필터링
- 가격 / 면적 / 인기 / 최신순 정렬
- 매물 상세 정보 확인
- LH 공공상가 공고 조회 지원

### 지도 기반 탐색

- Kakao Maps 기반 지도 화면
- 지역별 등록 매물 수 표시
- 시·군·구 / 읍·면·동 단위 탐색
- 지역별 업종 분포 확인
- 지도 검색 및 테마 필터

### 매물 등록 및 관리

- 공실 매물 직접 등록
- 거래유형 및 가격 정보 입력
- 주소 / 좌표 / 면적 / 연락처 입력
- 본인이 등록한 매물 조회 및 삭제

### 사용자 기능

- 매물 즐겨찾기
- 리뷰 등록 / 수정 / 삭제
- 내가 등록한 매물 조회
- 로그인 대신 브라우저별 방문자 식별 키 사용

### 창업 참고 분석

- 조건 기반 매물 추천
- 예상 매출 / 영업이익 / BEP 참고 계산
- 지역 간 조건 비교
- 지역과 업종 조건을 이용한 상권 참고 분석

### 창업 지원 정보

- 창업 관련 뉴스 조회
- 청년창업 / 지원금 / 정책 / 교육·멘토링 필터
- 키워드 검색

---

## Hackathon Contribution

해커톤 당시 저는 **Frontend를 혼자 담당했습니다.**

주요 역할은 서비스의 화면 구조와 사용자 흐름을 만드는 것이었습니다.

### 담당 영역

- 서비스 Landing / Home 화면
- 상권 분석 입력 화면
- 공실 매물 관련 화면
- 지도 기반 탐색 UI
- 창업 정보 및 결과 화면
- 공통 Header / Navigation / Layout
- 화면 간 Routing 및 사용자 이동 흐름

해커톤 기간에는 화면 구현을 우선적으로 진행했으며,  
Backend API와의 실제 통합은 완료하지 못했습니다.

이 경험을 통해 단순히 화면을 만드는 것뿐만 아니라  
Frontend와 Backend 사이에 **API 명세와 연동 방식에 대한 이해가 필요하다는 점**을 처음 크게 체감했습니다.

---

## Post-hackathon Improvements

대회 종료 이후 프로젝트를 개인적으로 다시 살펴보면서  
기존 Frontend와 Server 구조를 수정·보완했습니다.

### Frontend

현재 Frontend는 다음 구조를 사용합니다.

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios

페이지는 React Router를 통해 기능별로 분리되어 있습니다.

```text
/
├─ /wizard
├─ /wizard/result
├─ /listings
├─ /listings/:id
├─ /listings/new
├─ /map
├─ /consulting/simulate
├─ /consulting/compare
├─ /account
├─ /admin/upload
├─ /ai
├─ /ai/chat
├─ /support
└─ /more
```

페이지 Component는 `lazy()`를 사용해 동적으로 로드하도록 구성되어 있습니다.

### API Layer

Frontend의 Server 요청을 한 곳에서 관리하기 위해  
`frontend/src/services/api.ts`에 API 요청 및 Type을 정리했습니다.

주요 API 영역은 다음과 같습니다.

- Listings
- Reviews
- Favorites
- Market Analysis
- Simulation
- Region Statistics
- Support News
- Admin CSV Upload

API 요청 실패 시 공통 오류 메시지를 처리할 수 있도록 구성했습니다.

### Common Layout

`MainLayout`에서 공통 UI를 관리합니다.

- Header
- Navigation
- Main Content
- Footer
- React Router `Outlet`

페이지마다 Header와 Navigation을 반복 구현하지 않고  
공통 Layout을 통해 화면 구조를 공유하도록 구성했습니다.

---

## Current Server

현재 `server/`는 **해커톤 당시 팀 Backend가 아닙니다.**

해커톤 당시 Frontend 연동을 시도하면서 생성형 AI의 도움으로 시작된 별도 Express 코드이며,  
대회 종료 이후 개인적으로 수정하고 기능을 추가한 학습·프로토타입용 Server입니다.

현재 Server에서는 다음 기능을 제공합니다.

### Listings

```text
GET    /api/listings
GET    /api/listings/:id
POST   /api/listings
PUT    /api/listings/:id
DELETE /api/listings/:id
```

매물 등록 / 조회 / 수정 / 삭제를 처리합니다.

### Reviews

```text
GET    /api/listings/:id/reviews
POST   /api/listings/:id/reviews
PUT    /api/listings/:id/reviews/:reviewId
DELETE /api/listings/:id/reviews/:reviewId
```

### Favorites

```text
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:id
```

### Analysis

```text
POST /api/ai/recommend
POST /api/ai/simulate
POST /api/ai/compare
POST /api/ai/market-analysis
POST /api/ai/chat
```

### Map / Statistics

```text
GET /api/map/count-by-level
GET /api/map/nearby-biz-counts
GET /api/map/listings-by-region
GET /api/stats/nearby
```

### External / Admin

```text
GET  /api/public/lh-commercial-notices
GET  /api/support/news
POST /api/admin/upload-csv
```

---

## AI / Analysis Implementation

프로젝트 이름에는 `AI`가 포함되어 있지만,  
**현재 저장소의 분석 및 채팅 기능은 LLM이나 생성형 AI 모델을 사용하지 않습니다.**

현재 구현은 주로:

- 등록된 매물 데이터
- 지역별 참고용 휴리스틱
- 사용자 입력 조건
- Keyword Matching

을 이용합니다.

### Recommendation

매물 추천은 등록 매물의 조건과 다음 참고 지표를 가중치로 계산합니다.

- 유동인구 참고 지표
- 청년층 참고 지표
- 임대비용
- 동일 지역·업종 경쟁 매물 수
- 사용자 선호도

현재 응답에는 이를 명확하게 구분하기 위해:

```text
method: heuristic-v2
```

형태의 Method 정보가 포함됩니다.

### Simulation

사용자가 입력한:

- 면적
- 임대료
- 인건비
- 기타 비용
- 원가율

등을 기준으로 예상 매출, 영업이익 및 BEP를 계산합니다.

결과는 **실제 매출 예측 모델이 아닌 참고용 계산값**입니다.

### AI Chat

현재 `AI Chat` 역시 생성형 AI가 아닙니다.

사용자가 입력한 문장에서 Keyword를 추출하여  
등록된 매물의:

- 제목
- 주소
- 지역
- 업종
- 테마

와 비교한 후 관련 매물을 반환하는 방식입니다.

따라서 현재 코드에서도:

> 생성형 AI 답변이 아니라 등록 데이터 검색 결과

라는 점을 명시하도록 구현되어 있습니다.

---

## Data & Reliability

현재 프로젝트에서는 실제 데이터와 참고용 계산값이 섞여 보이지 않도록 하는 것을 중요하게 다루고 있습니다.

등록 데이터가 없는 경우 임의의 숫자를 생성하기보다  
데이터 부족 상태를 사용자에게 알려주는 방향으로 수정했습니다.

예를 들어:

- 등록 매물 데이터와 휴리스틱 지표 구분
- 외부 뉴스 API 미설정 시 가짜 뉴스 생성하지 않음
- LH API 사용 불가 시 자체 등록 매물만 표시
- 분석 결과에 사용된 방식 표시
- API 오류 발생 시 사용자에게 오류 상태 표시

등을 적용했습니다.

---

## Visitor Ownership

별도의 회원가입 시스템 대신  
브라우저마다 생성되는 방문자 식별 키를 사용합니다.

해당 Key는:

- 내가 등록한 매물
- 작성한 리뷰
- 즐겨찾기

등의 소유자를 구분하는 데 사용됩니다.

Server에서는 원본 Key를 그대로 저장하지 않고  
`SHA-256` 기반 Hash 값을 이용하여 저장하도록 구성했습니다.

> 이 구조는 실제 상용 인증 시스템을 대체하기 위한 것이 아니라  
> 로그인 시스템 없이 사용자별 데이터를 구분하기 위한 프로토타입 구조입니다.

---

## Project Structure

```text
AI-here-2026/
│
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ CategoryGrid.tsx
│  │  │  ├─ FavoriteButton.tsx
│  │  │  ├─ ListingCard.tsx
│  │  │  ├─ Map.tsx
│  │  │  ├─ MapRightPanel.tsx
│  │  │  ├─ RadiusStats.tsx
│  │  │  ├─ ReviewList.tsx
│  │  │  └─ SearchHero.tsx
│  │  │
│  │  ├─ views/
│  │  │  ├─ Home.tsx
│  │  │  ├─ Wizard.tsx
│  │  │  ├─ WizardResult.tsx
│  │  │  ├─ Listings.tsx
│  │  │  ├─ Detail.tsx
│  │  │  ├─ ListingCreate.tsx
│  │  │  ├─ MapView.tsx
│  │  │  ├─ Simulate.tsx
│  │  │  ├─ Compare.tsx
│  │  │  ├─ AiLanding.tsx
│  │  │  ├─ AiChat.tsx
│  │  │  ├─ Account.tsx
│  │  │  └─ SupportNews.tsx
│  │  │
│  │  ├─ services/
│  │  │  └─ api.ts
│  │  │
│  │  ├─ shared/
│  │  │  ├─ MainLayout.tsx
│  │  │  ├─ ErrorPage.tsx
│  │  │  └─ NotFound.tsx
│  │  │
│  │  ├─ lib/
│  │  │  ├─ auth.ts
│  │  │  └─ kakao.ts
│  │  │
│  │  ├─ router.tsx
│  │  └─ main.tsx
│  │
│  └─ package.json
│
├─ server/
│  ├─ services/
│  │  ├─ ai.js
│  │  ├─ geocode.js
│  │  ├─ kakao.js
│  │  ├─ lh.js
│  │  ├─ metrics.js
│  │  ├─ naver.js
│  │  ├─ news.js
│  │  ├─ security.js
│  │  ├─ store.js
│  │  └─ validation.js
│  │
│  ├─ tests/
│  │  ├─ ai.test.js
│  │  ├─ app.test.js
│  │  ├─ lh.test.js
│  │  ├─ news.test.js
│  │  └─ store.test.js
│  │
│  ├─ data/
│  │  └─ listings.json
│  │
│  ├─ app.js
│  ├─ server.js
│  └─ package.json
│
├─ package.json
└─ package-lock.json
```

---

## Tech Stack

### Frontend

| Category | Technology |
| --- | --- |
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| HTTP Client | Axios |

### Server

| Category | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express |
| Data Storage | JSON File |
| File Processing | Multer, csv-parse |
| Test | Node.js Test Runner |

### External Integration

| Category | Service |
| --- | --- |
| Map | Kakao Maps |
| Geocoding | Kakao / Naver 관련 코드 |
| Public Listings | LH Public Data |
| Startup News | External News API |

일부 외부 기능은 별도의 API Key와 환경변수 설정이 필요합니다.

---

## Current Limitations

이 프로젝트는 상용 서비스를 목표로 완성된 시스템이 아니라  
**해커톤 결과물을 기반으로 개인적으로 개선한 학습·프로토타입 프로젝트**입니다.

현재 다음과 같은 한계가 있습니다.

- 해커톤 당시 실제 Backend 연동은 완료하지 못함
- 현재 Server는 해커톤 팀 Backend와 별개의 구현
- Database 대신 JSON 파일 저장소 사용
- 실제 회원 인증 시스템 없음
- 생성형 AI / LLM 모델을 사용하지 않음
- 상권 지표 일부는 실제 통계가 아닌 참고용 휴리스틱
- 외부 API Key가 없으면 일부 지도·뉴스·공공데이터 기능 제한
- 여러 Server Instance를 사용하는 Production 환경을 고려한 저장 구조가 아님

따라서 분석 결과는 실제 투자 또는 창업 의사결정을 위한 값이 아니라  
서비스 흐름과 데이터 활용 방식을 구현하기 위한 **참고용 결과**입니다.

---

## Getting Started

### Requirements

- Node.js 20+
- npm

### Install

```bash
git clone https://github.com/developer-sw/AI-here-2026.git
cd AI-here-2026

npm install
```

이 프로젝트는 npm Workspaces를 사용하므로  
루트에서 한 번의 `npm install`로 Frontend와 Server 의존성을 관리합니다.

### Environment Variables

Frontend:

```powershell
Copy-Item frontend/.env.sample frontend/.env
```

Server:

```powershell
Copy-Item server/.env.sample server/.env
```

Kakao Maps, Geocoding, 외부 데이터 등의 기능을 사용하려면  
각 `.env`에 필요한 API Key를 설정해야 합니다.

### Run Server

```bash
npm run dev:server
```

기본 API 주소:

```text
http://localhost:5050/api
```

### Run Frontend

다른 Terminal에서:

```bash
npm run dev:frontend
```

기본 Web 주소:

```text
http://localhost:3000
```

---

## Verification

전체 Type Check, Server Test 및 Frontend Build를 한 번에 실행할 수 있습니다.

```bash
npm run check
```

루트의 `check`는 다음 작업을 순서대로 실행합니다.

```text
Frontend Type Check
        ↓
Server Test
        ↓
Frontend Build
```

---

## What I Learned

이 프로젝트는 단순히 성공적으로 끝난 해커톤 결과물이라기보다  
**처음으로 Frontend 전체를 혼자 맡으면서 부족했던 부분을 직접 경험한 프로젝트**였습니다.

해커톤 당시에는 화면 구현에 집중했지만  
Backend와 어떻게 데이터를 주고받아야 하는지, API가 어떤 역할을 하는지,  
Frontend와 Backend 사이의 계약이 왜 필요한지 충분히 이해하지 못했습니다.

그 결과 실제 서비스 연동까지 완료하지 못했지만,  
이 경험을 계기로 해커톤 이후에도 프로젝트를 다시 살펴보며  
Frontend 구조와 Server API를 개인적으로 수정하고 보완했습니다.

이 과정에서 다음 내용을 학습했습니다.

- React 기반 다중 페이지 서비스 구성
- TypeScript를 이용한 API Data Type 관리
- React Router를 이용한 화면 흐름 관리
- Axios 기반 Client / Server 통신 구조
- 공통 Component 및 Layout 분리
- REST API 기본 구조
- CRUD 요청과 데이터 흐름
- 입력값 Validation과 Error Handling
- 간단한 사용자 데이터 소유권 처리
- JSON 기반 Server Data 관리
- Backend Test 작성 및 실행
- 실제 데이터와 추정값을 구분해서 표현하는 중요성

특히 **Frontend 화면 구현만으로 서비스가 완성되는 것이 아니라  
Frontend와 Backend 사이의 데이터 구조와 API 설계가 함께 맞아야 한다는 점**을 배운 프로젝트입니다.

현재는 이 경험을 바탕으로  
Java / Spring Boot 기반 Backend 개발을 중심으로 역량을 확장하고 있습니다.
