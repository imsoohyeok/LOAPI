# 로스트아크 툴즈

로스트아크 오픈 API를 활용한 캐릭터 분석 도구 모음입니다. AI 호출 없이 순수 프론트엔드
데이터 가공·시각화 역량에 집중한 구조입니다.

## 기능

| 페이지        | 설명                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `/`           | 홈 랜딩 (기능 소개 + 최근 기록한 캐릭터)                             |
| `/compare`    | 두 캐릭터를 나란히 비교 (아이템레벨, 서버, 직업, 장비)               |
| `/tracker`    | 캐릭터 아이템레벨 성장 추이를 localStorage에 기록하고 차트로 확인    |
| `/expedition` | 캐릭터 하나로 같은 원정대의 전 캐릭터를 서버별·아이템레벨순으로 확인 |
| `/market`     | 거래소 아이템을 카테고리·등급·이름으로 검색하고 현재 최저가를 확인   |

## 기술 스택

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zod · Recharts
ESLint + Prettier · Vitest + React Testing Library · Husky · GitHub Actions · Codecov · Lighthouse CI

## 폴더 구조

```
lostark-analyzer/
├── app/
│   ├── page.tsx                        ← 홈 랜딩
│   ├── layout.tsx                      ← 전역 레이아웃 (Navbar 포함)
│   ├── compare/page.tsx                ← 캐릭터 비교 페이지
│   ├── tracker/page.tsx                ← 성장 트래커 페이지
│   ├── expedition/page.tsx             ← 원정대 페이지
│   ├── market/                         ← 거래소 페이지 (page.tsx + MarketView.tsx)
│   └── api/
│       ├── character/[name]/
│       │   ├── route.ts                ← 로스트아크 API 프록시
│       │   └── siblings/route.ts       ← 원정대(siblings) 프록시
│       └── market/
│           ├── items/route.ts          ← 거래소 검색 프록시 (GET → 로스트아크 POST)
│           └── options/route.ts        ← 거래소 카테고리·등급 목록 프록시
├── components/
│   ├── Navbar.tsx
│   ├── TrackedCharacters.tsx           ← 홈 전용 (최근 기록한 캐릭터)
│   ├── SearchBar.tsx
│   ├── CharacterCard.tsx
│   ├── EquipmentGrid.tsx
│   ├── EngravingList.tsx
│   ├── CompareTable.tsx                ← 비교 페이지 전용
│   ├── RosterTable.tsx                 ← 원정대 페이지 전용
│   ├── GrowthChart.tsx                 ← 트래커 페이지 전용 (recharts)
│   ├── SnapshotList.tsx                ← 트래커 페이지 전용
│   ├── MarketSearchForm.tsx            ← 거래소 페이지 전용 (카테고리·등급·검색어)
│   ├── MarketItemTable.tsx             ← 거래소 페이지 전용 (정렬 가능한 시세 표)
│   └── Pagination.tsx
├── lib/
│   ├── features.ts                     ← 내비게이션·홈 카드 공용 페이지 목록
│   ├── types.ts                        ← Zod 스키마 + 타입
│   ├── lostark.ts                      ← 로스트아크 API 클라이언트 (서버 전용)
│   ├── cache.ts                        ← 인메모리 캐시
│   ├── cacheStatus.ts                  ← 캐시 TTL·캐시 상태 배지 문구 (서버·클라이언트 공용)
│   ├── apiError.ts                     ← API 라우트 공통 에러 응답
│   ├── storage.ts                      ← localStorage 스냅샷 저장 (트래커용)
│   ├── utils.ts                        ← 공통 유틸 (아이템레벨 파싱 등)
│   ├── roster.ts                       ← 원정대 서버별 그룹·정렬·요약 (순수 함수)
│   ├── useCharacterSearch.ts           ← 캐릭터 조회 공용 훅
│   ├── useRoster.ts                    ← 원정대 조회 훅
│   ├── market.ts                       ← 거래소 응답 스키마 + 가격 계산 (순수 함수)
│   ├── marketParams.ts                 ← 거래소 검색 조건 ↔ URL 쿼리 (클라이언트·서버 공용)
│   └── useMarket.ts                    ← 거래소 URL 상태·검색·옵션 훅
└── __tests__/                          ← Vitest + RTL 테스트
```

## 설계 포인트

- **비교/트래커가 검색 로직을 공유**합니다. `lib/useCharacterSearch.ts` 훅 하나로 두 페이지 모두
  로딩·에러·데이터 상태를 관리해서 중복을 줄였습니다.
- **홈은 서버 컴포넌트입니다.** 기능 카드는 정적으로 렌더링하고, localStorage를 읽는
  `TrackedCharacters`만 클라이언트 컴포넌트로 분리해 마운트 후에 읽습니다(하이드레이션 불일치 방지).
- **트래커는 서버 저장소가 없습니다.** `lib/storage.ts`가 브라우저 `localStorage`만 사용하므로
  비용이 전혀 들지 않고, 사용자의 데이터가 외부로 전송되지 않습니다.
- **비교 테이블의 하이라이트 로직**(`CompareTable.tsx`)은 아이템레벨을 숫자로 변환해서
  비교합니다. API가 문자열("1680.00")로 내려주기 때문에 `lib/utils.ts`의 `parseItemLevel`을 거칩니다.
- **원정대 데이터 가공은 순수 함수로 분리**했습니다. `lib/roster.ts`가 서버별 그룹·정렬·요약을
  맡아서 UI 없이 단위 테스트할 수 있고, `useRoster`는 연속 검색 시 이전 요청을 `AbortController`로
  취소해 늦게 도착한 응답이 최신 결과를 덮어쓰지 않도록 했습니다.
- **응답이 서버 캐시에서 왔는지 배지로 보여줍니다.** API 라우트는 `fromCache`와 함께 조회 시각이
  아닌 경과 시간(`ageMs`)을 내려주고, 클라이언트가 받은 시각에서 빼서 조회 시각을 계산합니다.
  서버와 브라우저 시계가 어긋나도 "3분 전"이 정확하게 나옵니다.
- **거래소 검색 조건은 URL이 원본입니다.** `lib/marketParams.ts` 하나로 페이지와 서버 프록시가 같은
  규칙으로 쿼리를 읽어서, 잘못된 값의 처리(기본값으로 되돌림)가 양쪽에서 어긋나지 않습니다. 페이지를
  넘길 때는 React Query의 `keepPreviousData`로 이전 결과를 흐리게 유지하고, "다음" 버튼에 마우스를
  올리면 다음 페이지를 미리 받아 둡니다.
- **AI 분석 기능은 제거했습니다.** 별도 API 크레딧/과금 없이 로스트아크 API만으로 완결되는
  구조로 방향을 바꿨습니다.

## 실행 방법

1. 의존성 설치
   ```bash
   npm install
   ```
2. 환경변수 설정
   ```bash
   cp .env.local.example .env.local
   ```
   `LOSTARK_API_KEY`만 채워넣으면 됩니다.
3. 개발 서버 실행
   ```bash
   npm run dev
   ```

## 다음 단계 (직접 채워보면 좋은 것)

- [x] `/market` 페이지 — 거래소 시세 검색·필터·페이지네이션
- [ ] `/market` 아이템 상세 — `/markets/items/{id}` 가격 이력 + recharts 라인차트
- [ ] 비교 페이지에 URL 쿼리파라미터로 비교 결과 공유 링크 만들기 (`?a=이름1&b=이름2`)
- [ ] 트래커 페이지에서 여러 캐릭터를 한 화면에서 전환하며 보기 (`getTrackedCharacterNames` 활용)
- [ ] `CompareTable`, `GrowthChart`, `storage.ts`에 대한 Vitest 테스트 추가
- [ ] Vercel 배포

## 주의사항

- 로스트아크 오픈 API 실제 응답 필드는 공식 문서와 다를 수 있습니다. 키 발급 후 실제 응답을
  확인하고 `lib/types.ts`의 Zod 스키마를 맞춰 조정하세요.
- 캐릭터가 "검색 허용" 상태가 아니면 API가 404를 반환합니다.
