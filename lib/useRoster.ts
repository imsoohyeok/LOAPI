"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoster, queryKeys, toErrorMessage } from "@/lib/api";
import type { CacheInfo } from "@/lib/cacheStatus";
import type { Roster } from "@/lib/types";

interface UseRosterResult {
  roster: Roster | null;
  cacheInfo: CacheInfo | null;
  searchedName: string | null;
  loading: boolean;
  error: string | null;
  search: (name: string) => void;
}

export function useRoster(): UseRosterResult {
  const [searchedName, setSearchedName] = useState<string | null>(null);

  // 이전에는 AbortController를 직접 관리했지만, 쿼리 키가 바뀌면 이전 응답이 화면에
  // 반영되지 않고 signal로 요청도 취소되므로 같은 보장을 React Query가 대신 해줍니다.
  const query = useQuery({
    queryKey: queryKeys.roster(searchedName ?? ""),
    queryFn: ({ signal }) => fetchRoster(searchedName!, signal),
    enabled: searchedName !== null,
  });

  function search(next: string) {
    if (next === searchedName) {
      if (query.isError) void query.refetch();
      return;
    }
    setSearchedName(next);
  }

  return {
    roster: query.data?.roster ?? null,
    cacheInfo: query.data?.cacheInfo ?? null,
    searchedName,
    loading: query.isFetching,
    error: query.isError ? toErrorMessage(query.error) : null,
    search,
  };
}
