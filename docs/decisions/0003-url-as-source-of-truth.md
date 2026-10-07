# 0003. 공유할 수 있는 화면 상태는 URL을 원본으로 둔다

- 상태: 채택
- 날짜: 2026-10-07
- 근거: [#8 비교 결과 URL 공유](https://github.com/imsoohyeok/LOAPI/pull/8), [#11 트래커 캐릭터 전환](https://github.com/imsoohyeok/LOAPI/pull/11), [#12 거래소 페이지](https://github.com/imsoohyeok/LOAPI/pull/12)
- 관련 파일: `lib/compareParams.ts`, `lib/useCompareNames.ts`, `lib/trackerParams.ts`, `lib/useTrackerName.ts`, `lib/marketParams.ts`, `lib/useMarket.ts`

## 문제

비교 페이지의 두 캐릭터는 원래 컴포넌트 `useState`에만 있었습니다. 그래서 새로고침하면 사라지고,
뒤로가기로 이전 비교에 돌아갈 수 없고, 비교 결과를 링크로 공유할 수 없었습니다. 트래커의 현재
캐릭터, 거래소의 검색 조건도 같은 성격의 상태입니다. "이 화면이 무엇을 보여주는가"를 정하는
값이라서 주소만으로 같은 화면을 다시 그릴 수 있어야 합니다.

## 고려한 대안

1. **`useState`에 둔다.** 기존 상태입니다. 공유·새로고침·뒤로가기가 모두 안 됩니다.
2. **전역 스토어(Zustand 등)에 둔다.** 페이지를 오가도 유지되지만 주소에는 드러나지 않아서 공유와
   뒤로가기 문제는 그대로입니다.
3. **URL 쿼리에 두고 `router.push`로 바꾼다.** 동작은 하지만 App Router에서 `router.push`는 서버에
   RSC 페이로드를 다시 요청합니다.
4. **URL 쿼리에 두고 `window.history.pushState`로 바꾼다.** (채택)

## 결정과 이유

공유할 수 있는 화면 상태는 URL 쿼리를 **유일한 원본**으로 둡니다.

| 페이지     | 쿼리                                      | PR  |
| ---------- | ----------------------------------------- | --- |
| `/compare` | `?a=캐릭터1&b=캐릭터2`                    | #8  |
| `/tracker` | `?name=캐릭터`                            | #11 |
| `/market`  | `?category=&q=&grade=&sort=&order=&page=` | #12 |

- **쓰기는 `history.pushState`입니다.** Next 14.1부터 `pushState`가 `useSearchParams`와 동기화되어,
  서버 왕복 없이 URL만 바뀌고 컴포넌트가 다시 그려집니다. replace가 아닌 push라서 뒤로가기로 이전
  상태에 돌아갑니다(`lib/useCompareNames.ts`).
- **입구가 하나입니다.** 직접 검색한 경우, 공유 링크로 들어온 경우, 홈의 "최근 기록한 캐릭터"를 누른
  경우가 모두 "URL → 쿼리 → 화면"이라는 같은 경로로 그려집니다. 경로가 하나라서 테스트도 하나입니다.
- **읽기·쓰기 규칙은 순수 함수로 분리했습니다.** `readCompareNames`, `withCompareName`,
  `readMarketFilters`, `toMarketSearch`처럼 `URLSearchParams`를 받고 돌려주는 함수라서 브라우저 없이
  테스트합니다. 공백만 있는 값은 "선택 안 함"으로 보고(`normalizeQueryValue`, 비교·트래커 공용),
  utm 같은 다른 쿼리는 건드리지 않습니다.
- **잘못된 값은 오류 대신 기본값으로 되돌립니다(#12).** 손으로 고친 `?page=abc`는 "망가진 페이지"가
  아니라 "조건이 초기화된 페이지"가 됩니다. 기본값과 같은 항목은 URL에서 빼고 항목 순서를 고정해서,
  같은 조건이면 항상 같은 URL이 나옵니다.

## 트레이드오프

- `/compare`는 `generateMetadata`에서 `searchParams`를 읽어 공유 미리보기 제목("A vs B")을 만들기
  때문에 정적 페이지가 아니라 동적 렌더링이 됩니다(#8). 대신 서버 HTML에 검색창 값과 제목이 이미
  들어 있습니다. `/tracker`는 화면을 `TrackerView.tsx`로 분리하고 Suspense 경계를 둬서 정적
  페이지로 유지했습니다(#11).
- `useSearchParams`를 쓰는 클라이언트 컴포넌트는 `Suspense`로 감싸야 해서 페이지 파일이
  "서버 페이지 + 클라이언트 화면" 두 개로 나뉩니다.
- 검색어처럼 타이핑 중인 값까지 URL에 넣으면 글자마다 기록이 쌓이고 API를 부릅니다. 그래서 거래소
  검색어는 제출할 때만 URL에 반영합니다(#12).
