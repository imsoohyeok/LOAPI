"use client";

import { useSearchParams } from "next/navigation";
import { readTrackerName, withTrackerName } from "@/lib/trackerParams";

export function useTrackerName(): {
  name: string | null;
  setName: (name: string) => void;
} {
  const searchParams = useSearchParams();

  function setName(name: string) {
    const query = withTrackerName(new URLSearchParams(window.location.search), name);
    // 비교 페이지와 같은 방식입니다. 서버 왕복 없이 URL만 바꾸고 useSearchParams가 따라 바뀌며,
    // push라서 뒤로가기로 이전 캐릭터에 돌아갈 수 있습니다.
    window.history.pushState(null, "", `${window.location.pathname}?${query}`);
  }

  return { name: readTrackerName(searchParams), setName };
}
