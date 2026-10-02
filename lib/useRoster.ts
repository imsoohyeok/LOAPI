"use client";

import { useRef, useState } from "react";
import { RosterResponseSchema, type Roster } from "@/lib/types";

interface UseRosterResult {
  roster: Roster | null;
  searchedName: string | null;
  loading: boolean;
  error: string | null;
  search: (name: string) => Promise<void>;
}

export function useRoster(): UseRosterResult {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [searchedName, setSearchedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 검색을 연달아 하면 늦게 도착한 이전 응답이 최신 결과를 덮어쓸 수 있어서,
  // 진행 중인 요청을 취소하고 마지막 요청의 결과만 반영합니다.
  const controllerRef = useRef<AbortController | null>(null);

  async function search(name: string): Promise<void> {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setRoster(null);
    setSearchedName(name);

    try {
      const res = await fetch(`/api/character/${encodeURIComponent(name)}/siblings`, {
        signal: controller.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }

      const parsed = RosterResponseSchema.safeParse(json);
      if (!parsed.success) {
        setError("서버 응답 형식이 예상과 다릅니다.");
        return;
      }

      setRoster(parsed.data.roster);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }

  return { roster, searchedName, loading, error, search };
}
