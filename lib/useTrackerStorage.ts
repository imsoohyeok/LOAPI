"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getRawSnapshots,
  getTrackedSummaries,
  parseSnapshots,
  subscribeTracker,
  type Snapshot,
  type TrackedSummary,
} from "@/lib/storage";

// localStorage를 React 바깥의 "외부 저장소"로 보고 useSyncExternalStore로 구독합니다.
// - 저장·삭제하면 같은 화면의 차트, 기록 목록, 캐릭터 전환 목록이 한 번에 갱신되고,
//   다른 탭에서 기록해도 따라 바뀝니다. 컴포넌트마다 useState로 복사본을 들고 있을 필요가 없습니다.
// - 서버 렌더링과 하이드레이션 중에는 세 번째 인자(서버 스냅샷)를 쓰고, 그 직후 실제 값으로
//   다시 그려서 useEffect로 읽던 것과 같은 방식으로 하이드레이션 불일치를 피합니다.

const NO_SNAPSHOTS = () => null;

export function useSnapshots(characterName: string | null): Snapshot[] {
  const raw = useSyncExternalStore(
    subscribeTracker,
    () => (characterName ? getRawSnapshots(characterName) : null),
    NO_SNAPSHOTS,
  );
  return useMemo(() => parseSnapshots(raw), [raw]);
}

// 요약은 여러 키를 모아 만든 새 배열이라 매번 참조가 달라지므로, 비교 가능한 문자열로 직렬화해
// 스냅샷으로 쓰고 실제 배열은 문자열이 바뀔 때만 다시 만듭니다.
function getSummariesSnapshot(): string {
  return JSON.stringify(getTrackedSummaries());
}

// 서버에서는 아직 모르는 상태이므로 null입니다. 화면은 이때 자리만 잡아 둡니다.
export function useTrackedSummaries(): TrackedSummary[] | null {
  const serialized = useSyncExternalStore(
    subscribeTracker,
    getSummariesSnapshot,
    () => null,
  );
  return useMemo(
    () => (serialized === null ? null : (JSON.parse(serialized) as TrackedSummary[])),
    [serialized],
  );
}
