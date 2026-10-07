# 로스트아크 툴즈

로스트아크 오픈 API를 활용한 캐릭터 분석 도구 모음입니다. AI 호출 없이 순수 프론트엔드
데이터 가공·시각화 역량에 집중한 구조입니다.

## 기능

| 페이지           | 설명                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `/`              | 홈 랜딩 (기능 소개 + 최근 기록한 캐릭터)                             |
| `/compare`       | 두 캐릭터를 나란히 비교 (아이템레벨, 서버, 직업, 장비)               |
| `/tracker`       | 아이템레벨 성장 추이를 기록·차트로 확인, 기록한 캐릭터 간 전환       |
| `/expedition`    | 캐릭터 하나로 같은 원정대의 전 캐릭터를 서버별·아이템레벨순으로 확인 |
| `/market` (예정) | 거래소 시세 트래커                                                   |

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
│   └── api/character/[name]/
│       ├── route.ts                    ← 로스트아크 API 프록시
│       └── siblings/route.ts           ← 원정대(siblings) 프록시
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
│   └── SnapshotList.tsx                ← 트래커 페이지 전용
├── lib/
│   ├── features.ts                     ← 내비게이션·홈 카드 공용 페이지 목록
│   ├── types.ts                        ← Zod 스키마 + 타입
│   ├── lostark.ts                      ← 로스트아크 API 클라이언트 (서버 전용)
│   ├── cache.ts                        ← 인메모리 캐시
│   ├── apiError.ts                     ← API 라우트 공통 에러 응답
│   ├── storage.ts                      ← localStorage 스냅샷 저장·변경 구독 (트래커용)
│   ├── useTrackerStorage.ts            ← storage를 useSyncExternalStore로 구독하는 훅
│   ├── trackerParams.ts                ← 트래커 URL 쿼리(?name=) 읽기·쓰기
│   ├── utils.ts                        ← 공통 유틸 (아이템레벨 파싱 등)
│   ├── roster.ts                       ← 원정대 서버별 그룹·정렬·요약 (순수 함수)
│   ├── useCharacterSearch.ts           ← 캐릭터 조회 공용 훅
│   └── useRoster.ts                    ← 원정대 조회 훅
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

- [ ] `/market` 페이지 — 거래소 시세 API 연동 + recharts 라인차트
- [x] 비교 페이지에 URL 쿼리파라미터로 비교 결과 공유 링크 만들기 (`?a=이름1&b=이름2`)
- [x] 트래커 페이지에서 여러 캐릭터를 한 화면에서 전환하며 보기 (`?name=`)
- [ ] `CompareTable`, `GrowthChart`, `storage.ts`에 대한 Vitest 테스트 추가
- [ ] Vercel 배포

## 주의사항

- 로스트아크 오픈 API 실제 응답 필드는 공식 문서와 다를 수 있습니다. 키 발급 후 실제 응답을
  확인하고 `lib/types.ts`의 Zod 스키마를 맞춰 조정하세요.
- 캐릭터가 "검색 허용" 상태가 아니면 API가 404를 반환합니다.
