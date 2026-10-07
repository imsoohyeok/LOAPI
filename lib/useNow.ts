"use client";

import { useEffect, useState } from "react";

// "3분 전" 같은 상대 시간이 화면에 머무는 동안 낡지 않도록 현재 시각을 주기적으로 갱신합니다.
// 표시 단위가 분이라 30초 간격이면 최대 30초 늦게 바뀌고, 렌더링 비용은 무시할 만합니다.
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
