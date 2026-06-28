# AI여긴어때

지역 상권과 공실 매물을 탐색하고, 등록 매물 데이터와 참고용 휴리스틱을 이용해 창업 조건을 비교하는 웹 애플리케이션입니다.

## 구성

- `frontend`: React 18 + TypeScript + Vite + Tailwind CSS
- `server`: Express API + JSON 파일 저장소
- 루트 `package-lock.json` 하나로 npm workspaces 의존성을 관리합니다.

## 요구 사항

- Node.js 20 이상
- 선택: Kakao JavaScript 키와 Kakao Local REST 키
- 선택: Naver Cloud Maps Geocoding 키

## 환경변수

```powershell
Copy-Item frontend/.env.sample frontend/.env
Copy-Item server/.env.sample server/.env
```

`server/.env`의 `OWNER_KEY_PEPPER`와 `ADMIN_KEY`는 길고 무작위인 값으로 반드시 변경하세요. 지도 없이도 매물·리뷰·즐겨찾기 API는 실행됩니다.

## 설치 및 실행

```powershell
npm install

# 터미널 1
npm run dev:server

# 터미널 2
npm run dev:frontend
```

- 웹: http://localhost:3000
- API: http://localhost:5050/api

## 검증

```powershell
npm run check
npm audit --omit=dev
```

상권분석·매출·유동·청년 지표는 현재 등록 매물과 명시적인 휴리스틱을 사용한 참고값입니다. 외부 데이터가 없을 때 임의의 수치나 가짜 뉴스를 생성하지 않습니다.
