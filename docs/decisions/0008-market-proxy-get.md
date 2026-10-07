# 0008. 거래소 검색 프록시는 POST를 GET으로 열고 규칙을 공유한다

- 상태: 채택
- 날짜: 2026-10-07
- 근거: [#12 거래소 페이지](https://github.com/imsoohyeok/LOAPI/pull/12)
- 관련 파일: `app/api/market/items/route.ts`, `app/api/market/options/route.ts`, `lib/marketParams.ts`, `lib/useMarket.ts`

## 문제

로스트아크 거래소 검색 API(`/markets/items`)는 검색 조건을 본문에 담는 **POST**입니다. 이 앱은 API
키를 숨기려고 모든 요청을 Next.js API 라우트로 프록시합니다. 프록시도 POST로 열면 다음이 어긋납니다.

- 브라우저 주소의 검색 조건(`/market?q=파괴석&page=2`, [0003](./0003-url-as-source-of-truth.md))과
  프록시 요청이 서로 다른 형태가 됩니다.
- 서버 캐시 키를 본문에서 따로 만들어야 합니다.
- 페이지와 프록시가 각자 입력을 검증하면, 잘못된 값의 처리 규칙이 양쪽에서 달라질 수 있습니다.

## 고려한 대안

1. **프록시도 POST로 열고 본문을 그대로 전달한다.** 가장 단순하지만 위 문제가 남습니다.
2. **프록시를 GET으로 열고, 페이지와 같은 함수로 쿼리를 읽어 POST 본문을 만든다.** (채택)

## 결정과 이유

- **URL, 쿼리 키, 캐시 키가 1:1로 대응합니다.** 프록시는 `GET /api/market/items?category=&q=…`이고,
  같은 조건이면 같은 URL, 같은 TanStack Query 키, 같은 서버 캐시 키가 됩니다.
- **검증 규칙은 한 벌입니다.** 프록시는 페이지 URL을 읽을 때와 같은 `readMarketFilters`로 쿼리를 읽고
  `toMarketItemsRequest`로 로스트아크 요청 본문을 만듭니다. 잘못된 값이 기본값으로 바뀌는 규칙이
  클라이언트와 서버에서 어긋날 수 없습니다.
- 카테고리·등급 목록 라우트는 요청 정보를 읽지 않는 GET이라 빌드 때 정적으로 굳어지므로
  `dynamic = "force-dynamic"`을 지정했습니다. 클라이언트에서는 `staleTime: Infinity`로 한 번만 받습니다.

페이지 이동 경험도 같은 PR에서 다뤘습니다.

- `placeholderData: keepPreviousData`로 다음 페이지를 받는 동안 이전 결과를 흐리게 유지해 목록이
  깜빡이지 않습니다.
- "다음" 버튼에 마우스를 올리거나 포커스하면 다음 페이지를 `prefetchQuery`로 미리 받아 둡니다.
- 페이지네이션은 진짜 `<a href>` 링크라서 새 탭으로 열 수 있고, 일반 클릭만 `pushState`로 처리합니다.

## 트레이드오프

- 의미상 "조회"이므로 GET이 HTTP 의미에도 맞지만, 검색 조건이 길어지면 URL 길이 제한을 신경 써야
  합니다. 검색어를 30자로 자르고 페이지를 1000으로 제한해서 대응했습니다.
- 프리페치는 사용자가 실제로 넘기지 않으면 API 요청 한도를 쓰는 셈입니다. 마우스를 올리거나
  포커스했을 때만 받는 것으로 범위를 좁혔습니다.
