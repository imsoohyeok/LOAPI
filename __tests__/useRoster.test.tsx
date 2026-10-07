import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useRoster } from "@/lib/useRoster";
import type { Sibling } from "@/lib/types";
import {
  createQueryWrapper,
  flushMicrotasks,
  mockFetch,
  type PendingRequest,
} from "./helpers/query";

function sibling(name: string): Sibling {
  return {
    CharacterName: name,
    ServerName: "루페온",
    CharacterLevel: 70,
    CharacterClassName: "바드",
    ItemAvgLevel: "1,680.00",
  };
}

let requests: PendingRequest[];

beforeEach(() => {
  requests = mockFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderRoster() {
  return renderHook(() => useRoster(), { wrapper: createQueryWrapper() });
}

describe("useRoster", () => {
  it("검색한 이름과 원정대 목록을 반환한다", async () => {
    const { result } = renderRoster();

    act(() => {
      result.current.search("본캐");
    });
    expect(result.current.searchedName).toBe("본캐");
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.url).toBe(
      `/api/character/${encodeURIComponent("본캐")}/siblings`,
    );

    act(() => requests[0]?.respond({ roster: [sibling("본캐"), sibling("부캐")] }));
    await waitFor(() => expect(result.current.roster).toHaveLength(2));
    expect(result.current.loading).toBe(false);
  });

  it("연달아 검색하면 이전 요청을 취소하고 마지막 검색 결과만 보여준다", async () => {
    const { result } = renderRoster();

    act(() => {
      result.current.search("이전캐릭");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => {
      result.current.search("최신캐릭");
    });
    await waitFor(() => expect(requests).toHaveLength(2));
    const [older, newer] = requests;
    expect(older?.signal?.aborted).toBe(true);

    act(() => newer?.respond({ roster: [sibling("최신캐릭")] }));
    act(() => older?.respond({ roster: [sibling("이전캐릭")] }));
    await flushMicrotasks();

    await waitFor(() =>
      expect(result.current.roster?.[0]?.CharacterName).toBe("최신캐릭"),
    );
    expect(result.current.error).toBeNull();
  });

  it("응답의 캐시 정보를 브라우저 기준 조회 시각으로 바꿔 돌려준다", async () => {
    const { result } = renderRoster();

    act(() => {
      result.current.search("본캐");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    const before = Date.now();
    act(() =>
      requests[0]?.respond({
        roster: [sibling("본캐")],
        fromCache: true,
        ageMs: 120_000,
      }),
    );

    await waitFor(() => expect(result.current.cacheInfo).not.toBeNull());
    expect(result.current.cacheInfo?.fromCache).toBe(true);
    expect(result.current.cacheInfo?.fetchedAt).toBeGreaterThanOrEqual(before - 120_000);
    expect(result.current.cacheInfo?.fetchedAt).toBeLessThanOrEqual(Date.now() - 120_000);
  });

  it("API 에러 메시지를 그대로 보여준다", async () => {
    const { result } = renderRoster();

    act(() => {
      result.current.search("없는캐릭");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => requests[0]?.respond({ error: "캐릭터를 찾을 수 없습니다." }, 404));

    await waitFor(() => expect(result.current.error).toBe("캐릭터를 찾을 수 없습니다."));
    expect(result.current.roster).toBeNull();
  });
});
