import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackerView from "@/app/tracker/TrackerView";
import type { CharacterData } from "@/lib/types";
import { createQueryWrapper, mockFetch, type PendingRequest } from "./helpers/query";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

// recharts의 ResponsiveContainer는 jsdom에서 크기를 잴 수 없어서, 받은 기록 수만 보여주는 대역으로 바꿉니다.
vi.mock("@/components/GrowthChart", () => ({
  default: ({ snapshots }: { snapshots: unknown[] }) => (
    <p data-testid="chart">{snapshots.length}개 기록</p>
  ),
}));

function character(name: string, itemLevel = "1,680.00"): CharacterData {
  return {
    profile: {
      CharacterName: name,
      ServerName: "루페온",
      CharacterClassName: "바드",
      ItemAvgLevel: itemLevel,
    },
    equipment: [],
    engravings: { Engravings: [] },
    gems: { Gems: [], Skills: [] },
  };
}

function seed(name: string, snapshots: { date: string; itemLevel: number }[]) {
  window.localStorage.setItem(`lostark-tracker:${name}`, JSON.stringify(snapshots));
}

let requests: PendingRequest[];

beforeEach(() => {
  window.localStorage.clear();
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
      <TrackerView />
    </Wrapper>,
  );
}

async function respondWith(data: CharacterData) {
  await waitFor(() => expect(requests.length).toBeGreaterThan(0));
  act(() => requests.at(-1)!.respond(data));
}

describe("TrackerView", () => {
  it("?name=으로 들어오면 그 캐릭터를 조회하고 저장된 기록을 보여준다", async () => {
    seed("바드", [
      { date: "2026-10-01", itemLevel: 1675 },
      { date: "2026-10-03", itemLevel: 1680 },
    ]);
    renderView(`/tracker?name=${encodeURIComponent("바드")}`);

    expect(screen.getByPlaceholderText("캐릭터명을 입력하세요")).toHaveValue("바드");
    await respondWith(character("바드"));

    expect(await screen.findByTestId("chart")).toHaveTextContent("2개 기록");
    expect(screen.getByRole("link", { name: "바드" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("기록한 캐릭터들을 전환 링크로 보여준다", async () => {
    seed("바드", [{ date: "2026-10-01", itemLevel: 1675 }]);
    seed("소서리스", [{ date: "2026-10-05", itemLevel: 1700 }]);
    renderView("/tracker");

    const nav = await screen.findByRole("navigation", { name: "기록한 캐릭터" });
    const links = Array.from(nav.querySelectorAll("a"));
    expect(links.map((a) => a.textContent)).toEqual(["소서리스", "바드"]);
    expect(links[1]).toHaveAttribute(
      "href",
      `/tracker?name=${encodeURIComponent("바드")}`,
    );
    expect(links.some((a) => a.hasAttribute("aria-current"))).toBe(false);
    expect(requests).toHaveLength(0);
  });

  it("검색하면 URL의 name을 바꾼다", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    renderView("/tracker");

    await user.type(screen.getByPlaceholderText("캐릭터명을 입력하세요"), "바드");
    await user.click(screen.getByRole("button", { name: "검색" }));

    const url = new URL(String(pushState.mock.calls.at(-1)?.[2]), window.location.origin);
    expect(url.pathname).toBe("/tracker");
    expect(url.searchParams.get("name")).toBe("바드");
    pushState.mockRestore();
  });

  it("오늘 기록을 저장하면 차트와 캐릭터 목록이 함께 갱신된다", async () => {
    const user = userEvent.setup();
    renderView(`/tracker?name=${encodeURIComponent("바드")}`);
    await respondWith(character("바드", "1,685.00"));

    expect(await screen.findByTestId("chart")).toHaveTextContent("0개 기록");
    expect(screen.queryByRole("navigation", { name: "기록한 캐릭터" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "오늘 기록 저장" }));

    expect(screen.getByTestId("chart")).toHaveTextContent("1개 기록");
    expect(screen.getByText("오늘 기록이 저장되었어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "바드" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("마지막 기록을 지우면 캐릭터 목록에서도 빠진다", async () => {
    const user = userEvent.setup();
    seed("바드", [{ date: "2026-10-01", itemLevel: 1675 }]);
    renderView(`/tracker?name=${encodeURIComponent("바드")}`);
    await respondWith(character("바드"));

    await user.click(await screen.findByRole("button", { name: "삭제" }));

    expect(screen.getByTestId("chart")).toHaveTextContent("0개 기록");
    expect(screen.queryByRole("navigation", { name: "기록한 캐릭터" })).toBeNull();
  });

  it("백업 파일을 불러오면 캐릭터 전환 목록에 바로 나타난다", async () => {
    const user = userEvent.setup();
    renderView("/tracker");
    expect(screen.queryByRole("navigation", { name: "기록한 캐릭터" })).toBeNull();
    expect(screen.getByRole("button", { name: "파일로 내보내기" })).toBeDisabled();

    const backup = {
      kind: "lostark-tracker-backup",
      version: 1,
      exportedAt: "2026-10-07T00:00:00.000Z",
      characters: { 바드: [{ date: "2026-10-01", itemLevel: 1675 }] },
    };
    await user.upload(
      screen.getByLabelText("백업 파일 선택"),
      new File([JSON.stringify(backup)], "backup.json", { type: "application/json" }),
    );

    expect(await screen.findByRole("link", { name: "바드" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "파일로 내보내기" })).toBeEnabled();
  });
});
