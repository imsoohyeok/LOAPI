import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompareView from "@/app/compare/CompareView";
import type { CharacterData } from "@/lib/types";
import { createQueryWrapper, mockFetch, type PendingRequest } from "./helpers/query";

// 실제 Next 라우터 없이, 테스트가 정한 URL을 useSearchParams가 돌려주게 합니다.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

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
  window.history.replaceState(null, "", "/");
});

function renderView(url: string) {
  window.history.replaceState(null, "", url);
  const Wrapper = createQueryWrapper();
  return render(
    <Wrapper>
      <CompareView />
    </Wrapper>,
  );
}

describe("CompareView", () => {
  it("공유 링크로 들어오면 URL의 두 캐릭터를 바로 조회해 비교한다", async () => {
    renderView(
      `/compare?a=${encodeURIComponent("본캐")}&b=${encodeURIComponent("부캐")}`,
    );

    const inputs = screen.getAllByPlaceholderText("캐릭터명을 입력하세요");
    expect(inputs[0]).toHaveValue("본캐");
    expect(inputs[1]).toHaveValue("부캐");

    await waitFor(() => expect(requests).toHaveLength(2));
    act(() => {
      for (const req of requests) {
        const name = decodeURIComponent(req.url.split("/").pop()!);
        req.respond(character(name));
      }
    });

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "본캐" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "부캐" })).toBeInTheDocument();
  });

  it("검색하면 다른 쪽 이름을 유지한 채 URL에 기록한다", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    renderView(`/compare?a=${encodeURIComponent("본캐")}`);

    const inputB = screen.getAllByPlaceholderText("캐릭터명을 입력하세요")[1]!;
    await user.type(inputB, "부캐");
    await user.click(screen.getAllByRole("button", { name: /검색/ })[1]!);

    const url = new URL(String(pushState.mock.calls.at(-1)?.[2]), window.location.origin);
    expect(url.pathname).toBe("/compare");
    expect(url.searchParams.get("a")).toBe("본캐");
    expect(url.searchParams.get("b")).toBe("부캐");
    pushState.mockRestore();
  });
});

describe("CompareView 공유 버튼", () => {
  it("비교 결과가 나오면 지금 주소를 클립보드에 복사한다", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const url = `/compare?a=${encodeURIComponent("본캐")}&b=${encodeURIComponent("부캐")}`;
    renderView(url);

    await waitFor(() => expect(requests).toHaveLength(2));
    act(() => {
      for (const req of requests) {
        req.respond(character(decodeURIComponent(req.url.split("/").pop()!)));
      }
    });

    await user.click(await screen.findByRole("button", { name: "비교 링크 복사" }));
    expect(writeText).toHaveBeenCalledWith(window.location.origin + url);
    expect(screen.getByRole("button", { name: "복사됐어요!" })).toBeInTheDocument();
  });
});
