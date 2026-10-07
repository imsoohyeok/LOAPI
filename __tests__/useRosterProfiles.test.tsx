import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { profileRequestOrder, useRosterProfiles } from "@/lib/useRosterProfiles";
import { queryKeys } from "@/lib/api";
import type { Profile, Sibling } from "@/lib/types";
import { mockFetch, type PendingRequest } from "./helpers/query";

function sibling(name: string, level: string): Sibling {
  return {
    CharacterName: name,
    ServerName: "루페온",
    CharacterLevel: 70,
    CharacterClassName: "바드",
    ItemAvgLevel: level,
  };
}

function profile(name: string, combatPower: string): Profile {
  return {
    CharacterName: name,
    ServerName: "루페온",
    CharacterClassName: "바드",
    ItemAvgLevel: "1,680.00",
    CombatPower: combatPower,
  };
}

const roster = [
  sibling("부캐", "1,620.00"),
  sibling("본캐", "1,700.00"),
  sibling("창고", "1,100.00"),
];

let requests: PendingRequest[];
let queryClient: QueryClient;

beforeEach(() => {
  requests = mockFetch();
  // 앱과 같은 설정(staleTime 5분)이어야 이미 받은 데이터를 "신선하다"고 보고 재요청하지 않습니다.
  queryClient = makeQueryClient();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderProfiles() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useRosterProfiles(roster), { wrapper });
}

function requestFor(name: string) {
  return requests.find((r) => r.url.includes(encodeURIComponent(name)));
}

describe("profileRequestOrder", () => {
  it("아이템레벨이 높은 캐릭터부터 요청한다", () => {
    expect(profileRequestOrder(roster)).toEqual(["본캐", "부캐", "창고"]);
  });
});

describe("useRosterProfiles", () => {
  it("캐릭터마다 프로필을 요청하고 도착하는 대로 채운다", async () => {
    const { result } = renderProfiles();
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[0]?.url).toBe(`/api/character/${encodeURIComponent("본캐")}/profile`);
    expect(result.current.byName.get("본캐")).toEqual({ status: "pending" });

    act(() => requestFor("부캐")?.respond({ profile: profile("부캐", "1,500.00") }));
    await waitFor(() => expect(result.current.loaded).toBe(1));
    expect(result.current.byName.get("부캐")).toMatchObject({
      status: "success",
      profile: { CombatPower: "1,500.00" },
    });
    // 다른 캐릭터는 여전히 기다리는 중이어도 먼저 온 캐릭터는 바로 보입니다.
    expect(result.current.byName.get("본캐")).toEqual({ status: "pending" });
  });

  it("한 캐릭터가 실패해도 나머지는 그대로 보이고, 실패한 것만 다시 요청한다", async () => {
    const { result } = renderProfiles();
    await waitFor(() => expect(requests).toHaveLength(3));

    act(() => {
      requestFor("본캐")?.respond({ profile: profile("본캐", "2,000.00") });
      requestFor("부캐")?.respond({ profile: profile("부캐", "1,500.00") });
      requestFor("창고")?.respond({ error: "요청 한도를 초과했습니다." }, 429);
    });
    await waitFor(() => expect(result.current.failed).toBe(1));
    expect(result.current.loaded).toBe(2);
    expect(result.current.byName.get("창고")).toEqual({
      status: "error",
      message: "요청 한도를 초과했습니다.",
    });

    act(() => result.current.retryFailed());
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[3]?.url).toContain(encodeURIComponent("창고"));
  });

  it("전체 정보를 이미 받은 캐릭터는 그 프로필을 쓰고 요청하지 않는다", async () => {
    queryClient.setQueryData(queryKeys.character("본캐"), {
      profile: profile("본캐", "2,000.00"),
    });
    const { result } = renderProfiles();

    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requestFor("본캐")).toBeUndefined();
    expect(result.current.byName.get("본캐")).toMatchObject({
      status: "success",
      profile: { CombatPower: "2,000.00" },
    });
  });
});
