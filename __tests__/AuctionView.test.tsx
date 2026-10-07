import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuctionView from "@/app/auction/AuctionView";
import type { AuctionItem } from "@/lib/auction";
import { createQueryWrapper, mockFetch, type PendingRequest } from "./helpers/query";

// 거래소 화면 테스트와 같이, pushState·뒤로가기로 URL이 바뀌면 다시 그려지게 합니다.
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
    { Code: 210000, CodeName: "보석", Subs: [] },
    { Code: 200000, CodeName: "장신구", Subs: [{ Code: 200010, CodeName: "목걸이" }] },
  ],
  ItemGrades: ["유물", "고대"],
  ItemTiers: [3, 4],
  ItemGradeQualities: [70, 90],
  EtcOptions: [
    {
      Value: 7,
      Text: "연마 효과",
      EtcSubs: [
        {
          Value: 41,
          Text: "추가 피해",
          Class: "",
          EtcValues: [
            { DisplayValue: "0.7%", Value: 1 },
            { DisplayValue: "1.6%", Value: 2 },
            { DisplayValue: "2.6%", Value: 3 },
          ],
        },
      ],
    },
    {
      Value: 8,
      Text: "보석 효과",
      EtcSubs: [{ Value: 1, Text: "피해 증가", Class: null }],
    },
  ],
};

function item(name: string, buyPrice: number | null): AuctionItem {
  return {
    Name: name,
    Grade: "고대",
    Tier: 4,
    Level: null,
    Icon: null,
    GradeQuality: 95,
    AuctionInfo: {
      StartPrice: 1000,
      BuyPrice: buyPrice,
      BidPrice: 0,
      EndDate: "2099-01-01T00:00:00",
      BidCount: 0,
      BidStartPrice: 1000,
      IsCompetitive: false,
      TradeAllowCount: 2,
      UpgradeLevel: null,
    },
    Options: [
      {
        Type: "ACCESSORY_UPGRADE",
        OptionName: "추가 피해",
        Value: 2.6,
        IsPenalty: false,
        IsValuePercentage: true,
      },
    ],
  };
}

const itemsPage = (items: AuctionItem[], total = items.length) => ({
  PageNo: 1,
  PageSize: 10,
  TotalCount: total,
  Items: items,
});

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
      <AuctionView />
    </Wrapper>,
  );
}

const itemRequests = () => requests.filter((r) => r.url.startsWith("/api/auction/items"));
const lastPushedUrl = () =>
  new URL(String(pushState.mock.calls.at(-1)?.[2]), window.location.origin);

async function respondOptions() {
  await waitFor(() =>
    expect(requests.some((r) => r.url === "/api/auction/options")).toBe(true),
  );
  act(() => requests.find((r) => r.url === "/api/auction/options")!.respond(OPTIONS));
  await waitFor(() => expect(screen.getByLabelText("티어")).toBeEnabled());
}

describe("AuctionView", () => {
  it("URL의 옵션 조건으로 바로 조회하고 매물을 카드로 보여준다", async () => {
    renderView("/auction?category=200010&opt=7.41.3.");

    await waitFor(() => expect(itemRequests()).toHaveLength(1));
    const params = new URL(itemRequests()[0]!.url, "http://x").searchParams;
    expect(params.get("category")).toBe("200010");
    expect(params.getAll("opt")).toEqual(["7.41.3."]);

    act(() =>
      itemRequests()[0]!.respond(
        itemsPage([item("고대 목걸이", 125000), item("입찰 목걸이", null)]),
      ),
    );

    const results = await screen.findByRole("region", { name: "검색 결과" });
    expect(within(results).getByText("고대 목걸이")).toBeInTheDocument();
    expect(within(results).getByText("125,000")).toBeInTheDocument();
    expect(within(results).getByText("즉시 구매 불가")).toBeInTheDocument();
    expect(within(results).getAllByText("추가 피해 +2.6%")).toHaveLength(2);
  });

  it("옵션 조건은 다 고른 뒤 검색을 눌러야 URL에 반영된다", async () => {
    const user = userEvent.setup();
    renderView("/auction?page=3");
    await respondOptions();

    await user.click(screen.getByRole("button", { name: "+ 옵션 추가" }));
    await user.selectOptions(screen.getByLabelText("옵션 1 종류"), "연마 효과");
    expect(pushState).not.toHaveBeenCalled();

    // 정해진 값이 있는 옵션은 숫자 입력 대신 목록에서 고릅니다.
    await user.selectOptions(screen.getByLabelText("옵션 1 효과"), "추가 피해");
    await user.selectOptions(screen.getByLabelText("옵션 1 최소"), "1.6%");
    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(lastPushedUrl().searchParams.getAll("opt")).toEqual(["7.41.2."]);
    expect(lastPushedUrl().searchParams.has("page")).toBe(false);
  });

  it("1단계만 고른 옵션 줄은 검색 조건에서 빠진다", async () => {
    const user = userEvent.setup();
    renderView("/auction");
    await respondOptions();

    await user.click(screen.getByRole("button", { name: "+ 옵션 추가" }));
    await user.selectOptions(screen.getByLabelText("옵션 1 종류"), "보석 효과");
    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(lastPushedUrl().searchParams.has("opt")).toBe(false);
  });

  it("선택 상자는 바꾸는 즉시 검색하고, 정렬 방향을 뒤집을 수 있다", async () => {
    const user = userEvent.setup();
    renderView("/auction");
    await respondOptions();

    await user.selectOptions(screen.getByLabelText("티어"), "4티어");
    expect(lastPushedUrl().searchParams.get("tier")).toBe("4");

    await waitFor(() =>
      expect(itemRequests().some((r) => r.url.includes("tier=4"))).toBe(true),
    );
    act(() =>
      itemRequests()
        .find((r) => r.url.includes("tier=4"))!
        .respond(itemsPage([item("10레벨 겁화의 보석", 900000)])),
    );
    await screen.findByText("10레벨 겁화의 보석");

    await user.click(screen.getByRole("button", { name: /오름차순 정렬 중/ }));
    expect(lastPushedUrl().searchParams.get("order")).toBe("DESC");
  });

  it("뒤로가기로 URL이 바뀌면 입력 중인 옵션도 URL을 따라간다", async () => {
    renderView("/auction?opt=8.1..");
    await respondOptions();
    expect(screen.getByLabelText("옵션 1 종류")).toHaveValue("8");

    act(() => {
      window.history.replaceState(null, "", "/auction");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.queryByLabelText("옵션 1 종류")).not.toBeInTheDocument();
  });

  it("옵션 조건이 있는데 결과가 없으면 조건을 줄이라고 안내한다", async () => {
    renderView("/auction?opt=8.1.10.");
    await waitFor(() => expect(itemRequests()).toHaveLength(1));
    act(() => itemRequests()[0]!.respond(itemsPage([], 0)));
    expect(await screen.findByText(/옵션 조건을 줄여 보세요/)).toBeInTheDocument();
  });
});
