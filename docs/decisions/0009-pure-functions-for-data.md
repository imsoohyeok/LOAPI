# 0009. 데이터 가공은 UI 밖 순수 함수로 분리한다

- 상태: 채택
- 날짜: 2026-10-02
- 근거: [#3 보석 목록](https://github.com/imsoohyeok/LOAPI/pull/3), [#4 원정대 로스터](https://github.com/imsoohyeok/LOAPI/pull/4), [#12 거래소](https://github.com/imsoohyeok/LOAPI/pull/12), [#13 트래커 백업](https://github.com/imsoohyeok/LOAPI/pull/13)
- 관련 파일: `lib/roster.ts`, `lib/gems.ts`, `lib/engravings.ts`, `lib/market.ts`, `lib/marketParams.ts`, `lib/compareParams.ts`, `lib/trackerBackup.ts`

## 문제

이 앱의 핵심은 API 응답을 가공해서 보여주는 일입니다. 원정대는 서버별로 묶고 아이템레벨순으로
정렬해 요약을 계산하고, 보석은 피해·쿨감으로 분류해 스킬과 매칭하고, 거래소는 URL을 검색 조건으로
바꿉니다. 이 규칙을 컴포넌트 안에 두면 확인하려면 컴포넌트를 렌더링해야 하고, 규칙이 바뀔 때 UI
코드까지 같이 흔들립니다.

## 고려한 대안

1. **컴포넌트 안에서 가공한다.** 파일 수는 적지만 테스트가 렌더링에 묶입니다.
2. **규칙을 `lib/`의 순수 함수로 빼고, 컴포넌트와 훅은 호출만 한다.** (채택)

## 결정과 이유

입력을 받아 결과를 돌려주기만 하는 함수로 가공 규칙을 분리합니다.

| 파일                   | 담당하는 규칙                                               | PR  |
| ---------------------- | ----------------------------------------------------------- | --- |
| `lib/gems.ts`          | 보석 이름 정리, 피해·쿨감 분류, 슬롯-스킬 매칭, 정렬        | #3  |
| `lib/roster.ts`        | 서버별 그룹, 아이템레벨 정렬, 요약(최고·평균, 1640 이상 수) | #4  |
| `lib/marketParams.ts`  | URL ↔ 검색 조건, 로스트아크 요청 본문, 정렬 토글            | #12 |
| `lib/trackerBackup.ts` | 백업 형식 검증, 병합 계획(`planImport`)                     | #13 |

- **UI 없이 테스트합니다.** 예를 들어 `planImport`는 기존 기록을 읽는 함수를 인자로 받아서
  localStorage 없이 병합 규칙만 검증합니다([0006](./0006-tracker-backup-merge.md)).
- **같은 규칙을 여러 곳에서 씁니다.** `readMarketFilters`는 브라우저와 서버 프록시가 함께 씁니다
  ([0008](./0008-market-proxy-get.md)).
- 부작용(DOM, 파일 선택, localStorage 쓰기)은 바깥 계층(`lib/file.ts`, `lib/storage.ts`, 컴포넌트)에
  둡니다.

## 트레이드오프

- 파일이 늘어나고, 간단한 화면도 "컴포넌트 + 가공 함수"로 나뉩니다.
- 순수 함수 테스트만으로는 화면 연결이 맞는지 보장하지 못합니다. 그래서 `MarketView`,
  `TrackerView`, `CompareView` 같은 화면 단위 테스트를 함께 둡니다. 실제 브라우저 흐름을 확인하는
  E2E 테스트는 아직 없습니다.
