import { scoreByCompetition, rentIndex, footTrafficHeuristic, youthHeuristic, regionSnapshot } from './metrics.js'

const clampPreference = (value, fallback = 3) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(5, Math.max(1, number)) : fallback
}

export async function recommend(listings, profile = {}) {
  const requestedRegions = Array.isArray(profile.regions) ? profile.regions.filter(Boolean) : []
  const target = requestedRegions.length
    ? listings.filter((listing) => requestedRegions.includes(listing.region))
    : listings
  const preferences = profile.preferences || {}
  const weights = {
    footTraffic: clampPreference(preferences.footTraffic),
    rent: clampPreference(preferences.rentSensitivity),
    youth: clampPreference(preferences.youthPreference),
    competition: 3,
  }
  const tolerance = clampPreference(preferences.competitionTolerance)

  const rated = target.map((listing) => {
    const localCompetition = listings.filter((candidate) =>
      candidate.id !== listing.id
      && candidate.region === listing.region
      && candidate.category === listing.category).length
    const competitionScore = scoreByCompetition(localCompetition)
    const rentScore = rentIndex({ rent: listing.rentMonthly, area: listing.area })
    const factors = [
      { value: footTrafficHeuristic(listing.region), weight: weights.footTraffic },
      { value: youthHeuristic(listing.region), weight: weights.youth },
    ]
    if (rentScore !== null) factors.push({ value: 100 - rentScore, weight: weights.rent })
    if (competitionScore !== null) {
      const toleranceAdjusted = competitionScore + (100 - competitionScore) * (tolerance / 5)
      factors.push({ value: toleranceAdjusted, weight: weights.competition })
    }
    const weightTotal = factors.reduce((sum, factor) => sum + factor.weight, 0)
    const score = factors.reduce((sum, factor) => sum + factor.value * factor.weight, 0) / weightTotal
    return {
      ...listing,
      score: Math.round(score),
      competition: localCompetition,
    }
  })

  rated.sort((a, b) => b.score - a.score)
  const categories = Array.isArray(profile.desiredCategories) && profile.desiredCategories.length
    ? [...new Set(profile.desiredCategories)]
    : [...new Set(rated.map((listing) => listing.category).filter(Boolean))].slice(0, 4)

  return {
    method: 'heuristic-v2',
    categories,
    listings: rated.slice(0, 4),
    reasons: [
      '등록 매물의 임대 조건과 지역별 휴리스틱 지표를 정규화해 비교했습니다.',
      '경쟁도는 같은 지역·업종으로 등록된 다른 매물 수를 사용했습니다.',
    ],
  }
}

export function simulate(payload = {}) {
  const finite = (value, fallback, min, max = Number.MAX_SAFE_INTEGER) => {
    const number = Number(value)
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
  }
  const area = finite(payload.area, 50, 1, 10_000)
  const rent = finite(payload.rent, 0, 0)
  const labor = finite(payload.labor, 300, 0)
  const misc = finite(payload.misc, 100, 0)
  const cogsRate = finite(payload.cogsRate, 0.33, 0, 0.9)
  const traffic = footTrafficHeuristic(payload.region)

  const estimatedSales = Math.round(700 + traffic * 8 + area * 4)
  const contributionMargin = 1 - cogsRate
  const fixedCosts = Math.round(rent + labor + misc)
  const operatingProfit = Math.round(estimatedSales * contributionMargin - fixedCosts)
  const bepSales = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : null

  return {
    method: 'heuristic-v2',
    estimatedSales,
    operatingProfit,
    bepSales,
    recommendedCategory: payload.category || '일반',
    assumptions: { area, rent, labor, misc, cogsRate, trafficIndex: traffic },
  }
}

export function compare(listings, regionA, regionB) {
  const A = regionSnapshot(listings, regionA)
  const B = regionSnapshot(listings, regionB)
  return {
    method: 'local-data-and-heuristic-v2',
    A: { ...A, rentIndex: A.rentPerSquareMeter, competition: A.listingCount },
    B: { ...B, rentIndex: B.rentPerSquareMeter, competition: B.listingCount },
    summary: `${regionA} 등록 매물 ${A.listingCount}건, ${regionB} 등록 매물 ${B.listingCount}건을 기준으로 비교했습니다. 유동·청년 지표는 참고용 휴리스틱입니다.`,
  }
}

export function marketAnalysis(listings, payload = {}) {
  const location = String(payload.location || '').trim()
  const industries = Array.isArray(payload.industries) ? payload.industries.filter(Boolean) : []
  const snapshot = regionSnapshot(listings, location)
  const simulation = simulate({
    region: location,
    category: industries[0] || '일반',
    area: 60,
    rent: snapshot.rentPerSquareMeter ? snapshot.rentPerSquareMeter * 60 : 150,
  })
  const matching = listings
    .filter((listing) => !location || [listing.region, listing.dong, listing.sigungu].includes(location))
    .slice(0, 4)

  return {
    method: 'local-data-and-heuristic-v2',
    summary: `${location}의 등록 매물 ${snapshot.listingCount}건과 입력한 창업 조건을 바탕으로 계산한 참고용 분석입니다.`,
    recommendedCategories: industries.length ? industries.slice(0, 4) : ['일반'],
    hotZones: location ? [{ name: location, score: Math.round((snapshot.footTraffic + snapshot.youth) / 2) }] : [],
    estimatedSales: simulation.estimatedSales,
    bepSales: simulation.bepSales,
    insights: [
      `등록 매물 수: ${snapshot.listingCount}건`,
      `참고 유동 지표: ${snapshot.footTraffic}`,
      snapshot.rentPerSquareMeter === null
        ? '월세 단가 데이터가 충분하지 않습니다.'
        : `등록 매물 기준 월세 중앙값: ㎡당 ${snapshot.rentPerSquareMeter}만원`,
    ],
    listings: matching,
  }
}

export function chat(listings, prompt) {
  const query = String(prompt || '').trim().toLowerCase()
  const isGreeting = /^(안녕(?:하세요)?|반가워(?:요)?|하이|hello|hi)[\s!?.]*$/i.test(query)
  const asksCapabilities = [
    /(뭘|무엇을).*(할 수|해줄)/,
    /(어떤|무슨).*(기능|도움)/,
    /(기능|사용법|도움말)/,
    /어떻게.*(?:사용|질문)/,
    /도와줄 수/,
  ].some((pattern) => pattern.test(query))

  if (isGreeting || asksCapabilities) {
    return {
      method: 'guided-local-search-v3',
      answer: [
        isGreeting ? '안녕하세요! 공실 매물 탐색을 도와드리는 AI 메이트입니다.' : '저는 등록된 공실 매물을 조건에 맞춰 찾아드릴 수 있습니다.',
        '지역, 업종, 거래 유형, 테마를 함께 말씀해 주세요.',
        '예: “서산 카페 매물”, “부춘동 월세”, “주차 가능한 음식점”',
        '현재 답변은 등록된 매물 데이터 검색을 기반으로 하며 생성형 AI 답변은 아닙니다.',
      ].join('\n'),
      listings: [],
    }
  }

  const tokens = query.split(/[^0-9a-zA-Z가-힣]+/).filter((token) => token.length >= 2)
  const matches = listings.map((listing) => {
    const searchable = [listing.title, listing.address, listing.region, listing.category, ...(listing.theme || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const score = tokens.reduce((sum, token) => sum + (searchable.includes(token) ? 1 : 0), 0)
    return { listing, score }
  }).filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((result) => result.listing)
  return {
    method: 'guided-local-search-v3',
    answer: matches.length
      ? `“${prompt}”와 관련된 등록 매물 ${matches.length}건을 찾았습니다. 현재 답변은 등록 데이터 검색 결과이며 생성형 AI 답변은 아닙니다.`
      : `“${prompt}”와 일치하는 등록 매물을 찾지 못했습니다. “서산 카페”, “부춘동 월세”처럼 지역명과 업종 또는 거래 유형을 함께 입력해 보세요.`,
    listings: matches,
  }
}
