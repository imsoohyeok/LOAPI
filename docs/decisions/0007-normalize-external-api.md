# 0007. 외부 API의 형태 변화는 스키마·정규화 계층에서 흡수한다

- 상태: 채택
- 날짜: 2026-10-02
- 근거: [#2 각인·장비 표시](https://github.com/imsoohyeok/LOAPI/pull/2), [#3 보석 목록](https://github.com/imsoohyeok/LOAPI/pull/3), [#4 원정대 로스터](https://github.com/imsoohyeok/LOAPI/pull/4)
- 관련 파일: `lib/types.ts`, `lib/engravings.ts`, `lib/gems.ts`, `lib/lostark.ts`

## 문제

로스트아크 오픈 API는 게임 개편에 따라 응답 형태가 바뀌고, 문서와 실제 응답이 다른 경우가 있습니다.
작업 중에 실제로 세 번 부딪혔습니다.

- **각인(#2)**: 기존 코드는 `Engravings` 필드만 읽었는데, 아크 패시브 도입 이후 실제 각인 정보는
  `ArkPassiveEffects`에 있고 `Engravings`는 대부분 `null`입니다. 그래서 각인이 항상 빈 목록이었습니다.
- **보석(#3)**: 보석의 `Effects`가 API 개편 전후로 배열에서 객체로 형태가 바뀌었습니다.
- **원정대(#4)**: 없는 캐릭터를 조회하면 404가 아니라 `200 + null`이 옵니다.

화면 컴포넌트가 원본 응답을 직접 읽으면 이런 변화가 UI 곳곳으로 번집니다.

## 고려한 대안

1. **컴포넌트에서 옵셔널 체이닝으로 방어한다.** 빈 화면은 피하지만 "어느 필드를 먼저 볼지" 같은
   규칙이 컴포넌트마다 흩어집니다.
2. **응답 경계에서 zod로 검증하고, 화면용 형태로 정규화하는 함수를 따로 둔다.** (채택)

## 결정과 이유

API 응답은 `lib/lostark.ts`에서 zod 스키마로 검증하고, 화면은 정규화된 형태만 봅니다.

- **각인은 우선순위로 읽습니다.** `normalizeEngravings`가 `ArkPassiveEffects`(현행) →
  `Effects`("원한 Lv. 3"을 파싱) → `Engravings`(구 각인서 슬롯, 레벨 정보 없음) 순서로 읽어서 화면용
  목록 하나를 만듭니다. 신·구 응답이 모두 같은 형태가 됩니다.
- **부분 실패를 허용합니다.** 보석의 `Effects` 스키마에 `.catch(null)`을 걸어서, 형태가 예상과 달라도
  적용 스킬 정보만 버리고 보석 목록은 살립니다. 이때 스키마의 입력 타입이 `unknown`이 되어
  `parseOrLog`의 타입을 `z.ZodType<T, z.ZodTypeDef, unknown>`으로 넓혔습니다.
- **의미를 바로잡습니다.** siblings의 `200 + null`은 `getSiblings()`에서 `NOT_FOUND`로 바꿔서, 다른
  라우트와 같은 404 응답이 되게 했습니다. 에러 → HTTP 응답 변환은 `lib/apiError.ts`의
  `toErrorResponse()`로 공통화했습니다.

## 트레이드오프

- 클라우드 작업 환경에는 로스트아크 API 키가 없어서, 이 규칙들은 샘플 데이터와 단위 테스트로만
  검증했습니다(#2 본문에 명시). 실제 응답 확인은 로컬에서 키를 넣고 해야 합니다.
- `.catch()`로 조용히 버린 데이터는 화면에서 사라질 뿐 오류로 드러나지 않습니다. 형태가 또 바뀌면
  알아채기 늦을 수 있습니다.
