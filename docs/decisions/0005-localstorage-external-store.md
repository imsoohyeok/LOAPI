# 0005. localStorage를 `useSyncExternalStore`로 구독한다

- 상태: 채택
- 날짜: 2026-10-07
- 근거: [#9 홈 랜딩](https://github.com/imsoohyeok/LOAPI/pull/9), [#11 트래커 캐릭터 전환](https://github.com/imsoohyeok/LOAPI/pull/11)
- 관련 파일: `lib/storage.ts`(`subscribeTracker`, `getRawSnapshots`), `lib/useTrackerStorage.ts`

## 문제

트래커 기록은 서버 없이 브라우저 `localStorage`에만 저장합니다. 비용이 들지 않고 사용자 데이터가
외부로 나가지 않기 때문입니다. #11에서 같은 기록을 읽는 화면이 늘어났습니다.

- 트래커의 성장 차트, 기록 목록, 기록한 캐릭터 전환 칩
- 홈의 "최근 기록한 캐릭터"(#9)

#9까지는 각 컴포넌트가 `useEffect`에서 localStorage를 읽어 `useState`에 복사했습니다. 이 방식은
기록을 저장·삭제해도 다른 컴포넌트의 복사본이 갱신되지 않고, 다른 탭의 변경도 반영되지 않습니다.

## 고려한 대안

1. **`useEffect` + `useState` 복사본을 유지하고 저장할 때마다 수동으로 다시 읽는다.** 읽는 곳이
   늘어날수록 갱신을 빠뜨리기 쉽습니다.
2. **Zustand의 `persist` 미들웨어로 옮긴다.** 동작은 하지만 이 상태 하나 때문에 전역 스토어를 들이는
   것은 이르다고 판단했습니다([0001](./0001-server-state-tanstack-query.md)).
3. **localStorage를 React 바깥의 외부 저장소로 보고 `useSyncExternalStore`로 구독한다.** (채택)

## 결정과 이유

`lib/storage.ts`가 구독 함수(`subscribeTracker`)를 제공하고, `lib/useTrackerStorage.ts`의 훅이
`useSyncExternalStore`로 구독합니다.

- **알림 경로가 둘입니다.** 이 모듈을 거친 저장·삭제는 리스너에 직접 알리고, 다른 탭의 변경은
  브라우저의 `storage` 이벤트로 받습니다(`storage` 이벤트는 변경한 탭 자신에게는 오지 않기 때문입니다).
  `e.key === null`은 다른 탭에서 `localStorage.clear()`를 부른 경우라 함께 처리합니다.
- **스냅샷은 문자열입니다.** `useSyncExternalStore`는 `getSnapshot`의 반환값을 `Object.is`로 비교해
  변경을 판단합니다. 파싱한 배열을 돌려주면 매번 새 참조라서 "항상 바뀌었다"고 판단해 무한 렌더링이
  일어납니다. 그래서 localStorage의 원본 문자열을 스냅샷으로 쓰고(`getRawSnapshots`), 파싱은
  `useMemo`로 문자열이 바뀔 때만 합니다. 여러 키를 모아 만드는 요약 목록은 `JSON.stringify`로
  직렬화한 문자열을 스냅샷으로 씁니다.
- **하이드레이션 불일치를 피합니다.** 서버에는 localStorage가 없으므로 세 번째 인자(서버 스냅샷)로
  `null`을 주고, 화면은 그동안 자리만 잡아 둡니다. 하이드레이션 직후 실제 값으로 다시 그려서
  `useEffect`로 읽던 것과 같은 결과를 냅니다.
- 마지막 기록을 지우면 키 자체를 지워서 빈 기록이 캐릭터 목록에 남지 않게 했습니다.

## 트레이드오프

- 요약 목록의 스냅샷은 `getSnapshot`이 불릴 때마다 모든 키를 읽고 직렬화합니다. React는 렌더마다
  `getSnapshot`을 부르므로 기록이 아주 많아지면 비용이 됩니다. 현재 규모(캐릭터 수십 개)에서는
  문제가 없고, 필요해지면 마지막 결과를 캐시해 두는 방식으로 바꿀 수 있습니다.
- localStorage에 직접 쓰는 코드가 이 모듈을 거치지 않으면 같은 탭의 구독자는 알림을 받지 못합니다.
  그래서 쓰기는 모두 `lib/storage.ts`의 함수로만 합니다. 백업 복원의 일괄 쓰기(#13)도
  `writeSnapshotsBulk`로 추가했습니다([0006](./0006-tracker-backup-merge.md)).
