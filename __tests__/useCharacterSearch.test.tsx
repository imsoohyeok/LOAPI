import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCharacterSearch } from "@/lib/useCharacterSearch";
import type { CharacterData } from "@/lib/types";
import {
  createQueryWrapper,
  flushMicrotasks,
  mockFetch,
  type PendingRequest,
} from "./helpers/query";

function character(name: string): CharacterData {
  return {
    profile: {
      CharacterName: name,
      ServerName: "루페온",
      CharacterClassName: "바드",
      ItemAvgLevel: "1,680.00",
    },
    equipment: [],
    engravings: { Engravings: [] },
    gems: { Gems: [], Skills: [] },
  };
}

let requests: PendingRequest[];

beforeEach(() => {
  requests = mockFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSearch() {
  return renderHook(() => useCharacterSearch(), { wrapper: createQueryWrapper() });
}

describe("useCharacterSearch", () => {
  it("검색 결과를 반환한다", async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.search("본캐");
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.url).toBe(`/api/character/${encodeURIComponent("본캐")}`);

    act(() => requests[0]?.respond(character("본캐")));
    await waitFor(() => expect(result.current.data?.profile.CharacterName).toBe("본캐"));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("이전 검색의 응답이 늦게 도착해도 최신 검색 결과를 덮어쓰지 않는다", async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.search("이전캐릭");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => {
      result.current.search("최신캐릭");
    });
    await waitFor(() => expect(requests).toHaveLength(2));
    const [older, newer] = requests;

    // 더 이상 화면에서 보지 않는 이전 요청은 취소됩니다.
    expect(older?.signal?.aborted).toBe(true);

    act(() => newer?.respond(character("최신캐릭")));
    await waitFor(() =>
      expect(result.current.data?.profile.CharacterName).toBe("최신캐릭"),
    );

    // 취소를 무시하는 서버라도 늦게 온 응답은 이전 키의 캐시에만 들어갑니다.
    act(() => older?.respond(character("이전캐릭")));
    await flushMicrotasks();
    expect(result.current.data?.profile.CharacterName).toBe("최신캐릭");
  });

  it("API 에러 메시지를 그대로 보여준다", async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.search("없는캐릭");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => requests[0]?.respond({ error: "캐릭터를 찾을 수 없습니다." }, 404));

    await waitFor(() => expect(result.current.error).toBe("캐릭터를 찾을 수 없습니다."));
    expect(result.current.data).toBeNull();
  });

  it("응답 형식이 스키마와 다르면 형식 오류를 보여준다", async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.search("본캐");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => requests[0]?.respond({ profile: null }));

    await waitFor(() =>
      expect(result.current.error).toBe("서버 응답 형식이 예상과 다릅니다."),
    );
  });

  it("실패한 이름을 다시 검색하면 재요청하고, 성공한 이름은 캐시를 쓴다", async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.search("본캐");
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => requests[0]?.respond({ error: "요청 한도를 초과했습니다." }, 429));
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      result.current.search("본캐");
    });
    await waitFor(() => expect(requests).toHaveLength(2));
    act(() => requests[1]?.respond(character("본캐")));
    await waitFor(() => expect(result.current.data?.profile.CharacterName).toBe("본캐"));
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.search("본캐");
    });
    await flushMicrotasks();
    expect(requests).toHaveLength(2);
  });
});
