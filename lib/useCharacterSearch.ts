"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCharacter, queryKeys, toErrorMessage } from "@/lib/api";
import type { CharacterData } from "@/lib/types";

interface CharacterQueryResult {
  data: CharacterData | null;
  loading: boolean;
  error: string | null;
}

interface UseCharacterSearchResult extends CharacterQueryResult {
  search: (name: string) => void;
  reset: () => void;
}

// 이름이 어디에 저장되는지(컴포넌트 state, URL 쿼리 등)는 호출하는 쪽이 정하고,
// 이 훅은 "이름 → 캐릭터 데이터"만 담당합니다.
// search는 다음 이름을 받아 저장소에 반영하는 setName을 감싼 함수입니다.
export function useCharacterQuery(
  name: string | null,
  setName: (next: string) => void,
): CharacterQueryResult & { search: (next: string) => void } {
  // 화면에 보이는 결과는 항상 지금 name의 쿼리 키에 해당하는 캐시입니다.
  // 검색을 연달아 해서 이전 요청이 늦게 도착해도 그 응답은 이전 키의 캐시에만 들어가므로
  // 최신 결과를 덮어쓰지 못하고, signal을 넘겨서 더 이상 보지 않는 요청은 취소됩니다.
  const query = useQuery({
    queryKey: queryKeys.character(name ?? ""),
    queryFn: ({ signal }) => fetchCharacter(name!, signal),
    enabled: name !== null,
  });

  function search(next: string) {
    // 같은 이름을 다시 검색하면 키가 바뀌지 않아 아무 일도 일어나지 않으므로,
    // 실패했던 검색만 직접 다시 시도합니다. 성공한 결과는 staleTime 동안 캐시를 그대로 씁니다.
    if (next === name) {
      if (query.isError) void query.refetch();
      return;
    }
    setName(next);
  }

  return {
    data: query.data ?? null,
    loading: query.isFetching,
    error: query.isError ? toErrorMessage(query.error) : null,
    search,
  };
}

export function useCharacterSearch(): UseCharacterSearchResult {
  const [name, setName] = useState<string | null>(null);
  return { ...useCharacterQuery(name, setName), reset: () => setName(null) };
}
