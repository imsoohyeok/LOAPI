import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MarketView from "@/app/market/MarketView";
import type { MarketItem } from "@/lib/market";
import { createQueryWrapper, mockFetch, type PendingRequest } from "./helpers/query";

// 실제 Next처럼 pushState·뒤로가기로 URL이 바뀌면 useSearchParams를 쓰는 컴포넌트가 다시 그려지게 합니다.
vi.mock("next/navigation", async () => {
  const React = await import("react");
  const subscribe = (onChange: () => void) => {
    window.addEventListener("popstate", onChange);
    window.addEventListener("test:navigate", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("test:navigate", onChange);
    };
  };
  return {
    useSearchParams: () => {
      const search = React.useSyncExternalStore(subscribe, () => window.location.search);
      return React.useMemo(() => new URLSearchParams(search), [search]);
    },
  };
});

const OPTIONS = {
  Categories: [
    {
      Code: 50000,
      CodeName: "강화 재료",
      Subs: [{ Code: 50010, CodeName: "재련 재료" }],
    },
  ],
  ItemGrades: ["일반", "희귀", "전설"],
};

function item(id: number, name: string): MarketItem {
  return {
    Id: id,
    Name: name,
    Grade: "희귀",
    Icon: null,
    BundleCount: 10,
    TradeRemainCount: null,
    YDayAvgPrice: 100,
    RecentPrice: 105,
    CurrentMinPrice: 110,
  };
}

function itemsPage(page: number, names: string[], total = 25) {
  return {
    PageNo: page,
    PageSize: 10,
    TotalCount: total,
    Items: names.map((name, i) => item(page * 100 + i, name)),
  };
}

let requests: PendingRequest[];
let pushState: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  requests = mockFetch();
  const original = window.history.pushState.bind(window.history);
  pushState = vi.spyOn(window.history, "pushState").mockImplementation((...args) => {
    original(...args);
    window.dispatchEvent(new Event("test:navigate"));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

function renderView(url: string) {
  window.history.replaceState(null, "", url);
  const Wrapper = createQueryWrapper();
  return render(
    <Wrapper>
      <MarketView />
    </Wrapper>,
  );
}

const itemRequests = () => requests.filter((r) => r.url.startsWith("/api/market/items"));
const lastPushedUrl = () =>
  new URL(String(pushState.mock.calls.at(-1)?.[2]), window.location.origin);

async function respondOptions() {
  await waitFor(() =>
    expect(requests.some((r) => r.url === "/api/market/options")).toBe(true),
  );
  act(() => requests.find((r) => r.url === "/api/market/options")!.respond(OPTIONS));
  await waitFor(() => expect(screen.getByLabelText("등급")).toBeEnabled());
}

describe("MarketView", () => {
  it("URL의 검색 조건으로 바로 조회하고 결과를 표로 보여준다", async () => {
    renderView(`/market?q=${encodeURIComponent("파괴석")}&page=2`);

    expect(screen.getByLabelText("아이템 이름")).toHaveValue("파괴석");
    expect(screen.getByRole("status", { name: "시세 불러오는 중" })).toBeInTheDocument();

    await waitFor(() => expect(itemRequests()).toHaveLength(1));
    const params = new URL(itemRequests()[0]!.url, "http://x").searchParams;
    expect(params.get("q")).toBe("파괴석");
    expect(params.get("page")).toBe("2");

    act(() => itemRequests()[0]!.respond(itemsPage(2, ["정제된 파괴강석"])));

    const table = await screen.findByRole("table");
    expect(within(table).getByText("정제된 파괴강석")).toBeInTheDocument();
    expect(within(table).getByText("+10%")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "페이지" })).toBeInTheDocument();
  });

  it("다음 페이지를 누르면 새 결과가 올 때까지 이전 결과를 흐리게 유지한다", async () => {
    const user = userEvent.setup();
    renderView("/market");
    await waitFor(() => expect(itemRequests()).toHaveLength(1));
    act(() => itemRequests()[0]!.respond(itemsPage(1, ["1페이지 아이템"])));
    await screen.findByText("1페이지 아이템");

    await user.click(screen.getByRole("link", { name: "다음 페이지" }));
    expect(lastPushedUrl().searchParams.get("page")).toBe("2");

    // 호버 때 미리 받은 요청이 있을 수 있으니 page=2 요청을 찾아서 응답합니다.
    await waitFor(() =>
      expect(itemRequests().some((r) => r.url.includes("page=2"))).toBe(true),
    );
    expect(screen.getByText("1페이지 아이템")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "검색 결과" })).toHaveAttribute(
      "aria-busy",
      "true",
    );

    act(() =>
      itemRequests()
        .find((r) => r.url.includes("page=2"))!
        .respond(itemsPage(2, ["2페이지 아이템"])),
    );
    expect(await screen.findByText("2페이지 아이템")).toBeInTheDocument();
    expect(screen.queryByText("1페이지 아이템")).not.toBeInTheDocument();
    expect(
      screen.getByText("2", { selector: "[aria-current=page]" }),
    ).toBeInTheDocument();
  });

  it("필터를 바꾸면 1페이지로 돌아가고, 같은 정렬 머리글을 누르면 방향을 뒤집는다", async () => {
    const user = userEvent.setup();
    renderView("/market?page=3");
    await respondOptions();

    await user.selectOptions(screen.getByLabelText("등급"), "전설");
    expect(lastPushedUrl().searchParams.get("grade")).toBe("전설");
    expect(lastPushedUrl().searchParams.has("page")).toBe(false);

    await waitFor(() =>
      expect(itemRequests().some((r) => r.url.includes("grade="))).toBe(true),
    );
    act(() =>
      itemRequests()
        .find((r) => r.url.includes("grade="))!
        .respond(itemsPage(1, ["유물 각인서"])),
    );
    await screen.findByText("유물 각인서");

    // 기본 정렬이 현재 최저가 내림차순이므로, 같은 머리글을 누르면 오름차순이 됩니다.
    const header = screen.getByRole("columnheader", { name: /현재 최저가/ });
    expect(header).toHaveAttribute("aria-sort", "descending");
    await user.click(within(header).getByRole("button"));
    expect(lastPushedUrl().searchParams.get("order")).toBe("ASC");
  });

  it("빈 검색어로 제출하면 검색어를 지운다", async () => {
    const user = userEvent.setup();
    renderView(`/market?q=${encodeURIComponent("파괴석")}`);

    await user.clear(screen.getByLabelText("아이템 이름"));
    await user.click(screen.getByRole("button", { name: "검색" }));
    expect(lastPushedUrl().search).toBe("");
  });

  it("API 오류는 메시지와 다시 시도 버튼으로 보여준다", async () => {
    const user = userEvent.setup();
    renderView("/market");
    await waitFor(() => expect(itemRequests()).toHaveLength(1));
    act(() => itemRequests()[0]!.respond({ error: "요청 한도를 초과했습니다." }, 429));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("요청 한도를 초과했습니다.");

    await user.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(itemRequests()).toHaveLength(2));
  });
});
