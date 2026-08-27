# 로스트아크 툴즈

로스트아크 오픈 API를 활용한 캐릭터 분석 도구 모음입니다. AI 호출 없이 순수 프론트엔드
데이터 가공·시각화 역량에 집중한 구조입니다.

## 기능

| 페이지           | 설명                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `/`              | 홈 랜딩                                                           |
| `/compare`       | 두 캐릭터를 나란히 비교 (아이템레벨, 서버, 직업, 장비)            |
| `/tracker`       | 캐릭터 아이템레벨 성장 추이를 localStorage에 기록하고 차트로 확인 |
| `/market` (예정) | 거래소 시세 트래커                                                |

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
│   └── api/character/[name]/route.ts   ← 로스트아크 API 프록시
├── components/
│   ├── Navbar.tsx
│   ├── SearchBar.tsx
│   ├── CharacterCard.tsx
│   ├── EquipmentGrid.tsx
│   ├── EngravingList.tsx
│   ├── CompareTable.tsx                ← 비교 페이지 전용
│   ├── GrowthChart.tsx                 ← 트래커 페이지 전용 (recharts)
│   └── SnapshotList.tsx                ← 트래커 페이지 전용
├── lib/
│   ├── types.ts                        ← Zod 스키마 + 타입
│   ├── lostark.ts                      ← 로스트아크 API 클라이언트 (서버 전용)
│   ├── cache.ts                        ← 인메모리 캐시
│   ├── storage.ts                      ← localStorage 스냅샷 저장 (트래커용)
│   ├── utils.ts                        ← 공통 유틸 (아이템레벨 파싱 등)
│   └── useCharacterSearch.ts           ← 캐릭터 조회 공용 훅
└── __tests__/                          ← Vitest + RTL 테스트
```

## 설계 포인트

- **비교/트래커가 검색 로직을 공유**합니다. `lib/useCharacterSearch.ts` 훅 하나로 두 페이지 모두
  로딩·에러·데이터 상태를 관리해서 중복을 줄였습니다.
- **트래커는 서버 저장소가 없습니다.** `lib/storage.ts`가 브라우저 `localStorage`만 사용하므로
  비용이 전혀 들지 않고, 사용자의 데이터가 외부로 전송되지 않습니다.
- **비교 테이블의 하이라이트 로직**(`CompareTable.tsx`)은 아이템레벨을 숫자로 변환해서
  비교합니다. API가 문자열("1680.00")로 내려주기 때문에 `lib/utils.ts`의 `parseItemLevel`을 거칩니다.
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
- [ ] 비교 페이지에 URL 쿼리파라미터로 비교 결과 공유 링크 만들기 (`?a=이름1&b=이름2`)
- [ ] 트래커 페이지에서 여러 캐릭터를 한 화면에서 전환하며 보기 (`getTrackedCharacterNames` 활용)
- [ ] `CompareTable`, `GrowthChart`, `storage.ts`에 대한 Vitest 테스트 추가
- [ ] Vercel 배포

## 주의사항

- 로스트아크 오픈 API 실제 응답 필드는 공식 문서와 다를 수 있습니다. 키 발급 후 실제 응답을
  확인하고 `lib/types.ts`의 Zod 스키마를 맞춰 조정하세요.
- 캐릭터가 "검색 허용" 상태가 아니면 API가 404를 반환합니다.
