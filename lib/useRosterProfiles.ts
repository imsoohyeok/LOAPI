"use client";

import { useMemo } from "react";
import { useQueries, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { fetchProfile, queryKeys, toErrorMessage } from "@/lib/api";
import type { CharacterData, Profile, Roster } from "@/lib/types";
import { parseItemLevel } from "@/lib/utils";

export type ProfileState =
  | { status: "pending" }
  | { status: "success"; profile: Profile }
  | { status: "error"; message: string };

export interface RosterProfiles {
  byName: ReadonlyMap<string, ProfileState>;
  total: number;
  loaded: number;
  failed: number;
  retryFailed: () => void;
}

// 아이템레벨이 높은 캐릭터부터 요청합니다. 서버의 한도 큐는 들어온 순서대로 보내므로,
// 원정대가 커서 기다림이 생기더라도 사용자가 먼저 보고 싶은 주력 캐릭터가 먼저 채워집니다.
export function profileRequestOrder(roster: Roster): string[] {
  return roster
    .map((s) => ({ name: s.CharacterName, level: parseItemLevel(s.ItemAvgLevel) }))
    .sort((a, b) => b.level - a.level)
    .map((s) => s.name);
}

function toState(result: UseQueryResult<Profile>): ProfileState {
  if (result.data) return { status: "success", profile: result.data };
  if (result.isError) return { status: "error", message: toErrorMessage(result.error) };
  return { status: "pending" };
}

// 원정대 캐릭터마다 쿼리를 하나씩 둡니다(useQueries). 한 번에 받는 엔드포인트 대신 이렇게 나눈 이유:
// - 응답이 오는 대로 행 하나씩 채워져서 가장 느린 캐릭터를 기다리지 않습니다.
// - 한 캐릭터가 실패해도 나머지는 그대로 보이고, 실패한 것만 다시 요청할 수 있습니다.
// - 캐릭터 단위로 캐시돼서 같은 캐릭터를 다른 원정대·페이지에서 다시 볼 때 재사용됩니다.
export function useRosterProfiles(roster: Roster | null): RosterProfiles {
  const queryClient = useQueryClient();
  const names = useMemo(() => (roster ? profileRequestOrder(roster) : []), [roster]);

  return useQueries({
    queries: names.map((name) => ({
      queryKey: queryKeys.profile(name),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchProfile(name, signal),
      // 비교·성장 기록 페이지에서 이미 전체 정보를 받은 캐릭터면 그 안의 프로필로 요청을 건너뜁니다.
      // 받은 시각도 함께 넘겨야 staleTime 계산이 원래 데이터 기준으로 맞습니다.
      initialData: () =>
        queryClient.getQueryData<CharacterData>(queryKeys.character(name))?.profile,
      initialDataUpdatedAt: () =>
        queryClient.getQueryState(queryKeys.character(name))?.dataUpdatedAt,
    })),
    combine: (results) => {
      const byName = new Map<string, ProfileState>();
      let loaded = 0;
      let failed = 0;
      results.forEach((result, i) => {
        const state = toState(result);
        if (state.status === "success") loaded += 1;
        if (state.status === "error") failed += 1;
        byName.set(names[i]!, state);
      });
      return {
        byName,
        total: results.length,
        loaded,
        failed,
        retryFailed: () => {
          for (const result of results) if (result.isError) void result.refetch();
        },
      };
    },
  });
}
