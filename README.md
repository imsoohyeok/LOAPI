# 로스트아크 툴즈

로스트아크 오픈 API를 활용한 캐릭터 분석 도구 모음입니다. AI 호출 없이 순수 프론트엔드
데이터 가공·시각화 역량에 집중한 구조입니다.

## 기능

| 페이지        | 설명                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `/`           | 홈 랜딩 (기능 소개 + 최근 기록한 캐릭터)                             |
| `/compare`    | 두 캐릭터를 나란히 비교 (아이템레벨, 서버, 직업, 장비)               |
| `/tracker`    | 아이템레벨 성장 추이를 기록·차트로 확인, 기록한 캐릭터 간 전환       |
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
│   ├── tracker/page.tsx                ← 성장 트래커 페이지 (Suspense 경계)
│   ├── tracker/TrackerView.tsx         ← 트래커 화면 (?name= 쿼리 사용)
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
│   ├── TrackerCharacterSwitcher.tsx    ← 트래커 페이지 전용 (기록한 캐릭터 전환)
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
│   ├── storage.ts                      ← localStorage 스냅샷 저장·변경 구독 (트래커용)
│   ├── useTrackerStorage.ts            ← storage를 useSyncExternalStore로 구독하는 훅
│   ├── trackerParams.ts                ← 트래커 URL 쿼리(?name=) 읽기·쓰기
│   ├── utils.ts                        ← 공통 유틸 (아이템레벨 파싱 등)
│   ├── roster.ts                       ← 원정대 서버별 그룹·정렬·요약 (순수 함수)
│   ├── useCharacterSearch.ts           ← 캐릭터 조회 공용 훅
│   ├── useRoster.ts                    ← 원정대 조회 훅
│   ├── market.ts                       ← 거래소 응답 스키마 + 가격 계산 (순수 함수)
│   ├── marketParams.ts                 ← 거래소 검색 조건 ↔ URL 쿼리 (클라이언트·서버 공용)
│   └── useMarket.ts                    ← 거래소 URL 상태·검색·옵션 훅
├── docs/decisions/                     ← 설계 결정 기록 (ADR)
└── __tests__/                          ← Vitest + RTL 테스트
```

## 설계 포인트

- **비교/트래커가 검색 로직을 공유**합니다. `lib/useCharacterSearch.ts` 훅 하나로 두 페이지 모두
  로딩·에러·데이터 상태를 관리해서 중복을 줄였습니다.
- **홈은 서버 컴포넌트입니다.** 기능 카드는 정적으로 렌더링하고, localStorage를 읽는
  `TrackedCharacters`만 클라이언트 컴포넌트로 분리했습니다. 각 행은 `/tracker?name=`으로 가는 링크입니다.
- **트래커는 서버 저장소가 없습니다.** `lib/storage.ts`가 브라우저 `localStorage`만 사용하므로
  비용이 전혀 들지 않고, 사용자의 데이터가 외부로 전송되지 않습니다.
- **localStorage를 외부 저장소로 구독합니다.** `useTrackerStorage`가 `useSyncExternalStore`로
  기록을 읽어서, 저장·삭제나 다른 탭의 변경이 차트·기록 목록·캐릭터 전환 목록·홈에 한 번에
  반영됩니다. 서버 렌더링 중에는 서버 스냅샷(null)을 써서 하이드레이션 불일치를 피합니다.
- **트래커의 현재 캐릭터는 URL(`?name=`)에 둡니다.** 비교 페이지와 같은 방식이라 새로고침·
  뒤로가기·홈에서 링크로 들어오기가 모두 같은 경로로 그려집니다.
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

각 결정의 배경, 고려한 대안, 트레이드오프는 [결정 기록(`docs/decisions/`)](./docs/decisions/README.md)에
따로 정리했습니다.

## Claude와 협업한 방식

이 프로젝트는 Claude(Claude Code)로 만들고 있습니다. 첫 커밋 `claude 초안`의 Next.js 뼈대, 테스트,
CI 설정이 Claude가 만든 것이고, PR #2~#13의 기능도 모두 Claude가 구현했습니다. 커밋 작성자만 제
계정으로 두었습니다. 제가 맡은 일은 **무엇을 만들지, 어떤 순서로 만들지, 결과를 받아들일지**를 정하는
것이었습니다. 이 섹션은 그 과정을 PR과 대화 기록에 근거해 정리한 것입니다.

### 일하는 흐름

1. 다음에 할 일을 물으면 Claude가 후보를 3~4개 제안하고 추천과 이유를 붙입니다. 저는 그중에서
   고르거나 순서를 바꿉니다.
2. 고른 기능마다 별도 작업 스레드, 브랜치, PR이 만들어집니다. 브랜치 이름은 기능을 설명하게
   지었습니다(`feat/compare-url-share`, `feat/tracker-backup-restore` 등).
3. PR 본문에 "무엇을 왜 바꿨는지"를 파일 단위로 적게 했습니다. 그래서 PR 본문 자체가 설계 설명서이고,
   [결정 기록](./docs/decisions/README.md)은 이 본문들에서 모은 것입니다.
4. CI(lint·format·typecheck, Vitest, build·Lighthouse)가 통과하면 제가 검토하고 직접 머지합니다.

### 병렬로 진행하고, 서로 영향을 주는 작업은 순서를 정하기

여러 기능을 동시에 진행하되, **같은 코드를 건드리는 작업은 순서대로** 하게 했습니다.

- 트래커 캐릭터 전환(#11)과 트래커 백업·복원(#13)은 같은 트래커 코드를 고치므로, #11이 머지된 뒤에
  #13을 시작했습니다. 그동안 캐시 상태 배지(#10)와 거래소(#12)는 동시에 진행했습니다.
- 각인·장비(#2)와 보석(#3)은 트래커의 같은 자리에 내용을 넣어서 충돌을 미리 예상했고, #2를 먼저
  머지한 뒤 #3에서 main을 병합해 둘 다 보이게 했습니다.

### 충돌을 다룬 방식

#10(캐시 상태 배지)을 머지하자 동시에 진행하던 #11, #12에서 충돌이 났습니다.

- **머지 순서를 정했습니다.** #11을 먼저 머지하고, #12는 #11이 들어간 뒤 한 번 더 main을 병합했습니다.
- **리베이스 대신 main을 병합했습니다.** 이미 올라간 브랜치의 기록을 바꾸지 않기 위해서입니다
  (`🔀 main 머지` 커밋).
- **충돌이 없는 곳의 깨짐도 찾았습니다.** #10에서 `getCached`의 반환값이 값에서 `{ value, timestamp }`로
  바뀌었는데, #12의 거래소 라우트는 텍스트 충돌이 없었지만 이 값을 그대로 펼치면 타입 오류 없이
  응답 형식만 깨지는 상태였습니다. 이를 찾아 고친 내용을 #12 본문의 "수정 사항"에 남겼습니다.
- #11에서는 #10이 기존 트래커 페이지에 넣은 배지를, 화면을 옮긴 `TrackerView.tsx`의 같은 위치로
  옮겨서 해결했습니다.

### 제가 판단하거나 바꾼 결정

- **상태 관리 도구 선택**: 제가 React Query, Zustand, Jotai 도입을 물었고, Claude는 이 앱의 상태
  대부분이 서버 상태라는 이유로 React Query만 지금 넣고 나머지는 미루자고 제안했습니다. 저는
  React Query를 먼저 하고 그 뒤에 다른 기능을 진행하는 순서로 정했습니다(#7,
  [0001](./docs/decisions/0001-server-state-tanstack-query.md)).
- **배지 문구**: Claude가 만든 "서버 캐시 · 3분 전" 배지를 보고, 사용자에게는 개발 용어라서 쉬운 말로
  바꿔 달라고 했습니다. 그래서 "저장된 정보 / 새로 불러옴"이 되었습니다(#10).
- **작업 규칙**: 커밋 작성자, 깃모지 PR 제목, PR 본문 형식(요약 / 변경 사항), 기능 단위의 짧은 커밋,
  "gem" 대신 "jewel" 같은 이름 규칙을 정해 프로젝트 지침으로 두었습니다.
- **배포는 미뤘습니다.** 지금은 기능과 설계 기록에 집중하고 있습니다.

### Claude의 제안으로 바뀐 것

- **응답 경합 버그**: 원정대(#4) 작업 중 Claude가 `useCharacterSearch`에서 늦게 도착한 이전 응답이
  최신 결과를 덮어쓰는 버그를 찾았습니다. 따로 고치는 대신 React Query 도입(#7)으로 구조적으로
  없앴고, 경합을 재현하는 테스트가 이전 코드에서는 실패하는 것을 확인했습니다.
- **로컬 개발 환경 문제**: 제 PC에서 난 TypeScript 6의 `baseUrl` 경고는 #5로, `next dev`의 SWC 바이너리
  오류를 해결하면서 찾은 `package-lock.json` 불일치는 #6으로 고쳤습니다.

### 검증의 한계

클라우드 작업 환경에는 로스트아크 API 키가 없어서, Claude는 단위 테스트와 가짜 데이터로 띄운 화면
스크린샷으로 확인했습니다. 실제 API 응답은 제가 로컬에서 키를 넣고 확인해야 하며, PR 본문에 이
한계를 적어 두었습니다(예: #2).

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
- [x] 비교 페이지에 URL 쿼리파라미터로 비교 결과 공유 링크 만들기 (`?a=이름1&b=이름2`)
- [x] 트래커 페이지에서 여러 캐릭터를 한 화면에서 전환하며 보기 (`?name=`)
- [ ] `CompareTable`, `GrowthChart`, `storage.ts`에 대한 Vitest 테스트 추가
- [ ] Vercel 배포

## 주의사항

- 로스트아크 오픈 API 실제 응답 필드는 공식 문서와 다를 수 있습니다. 키 발급 후 실제 응답을
  확인하고 `lib/types.ts`의 Zod 스키마를 맞춰 조정하세요.
- 캐릭터가 "검색 허용" 상태가 아니면 API가 404를 반환합니다.
