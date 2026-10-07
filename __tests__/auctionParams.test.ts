import { describe, it, expect } from "vitest";
import {
  DEFAULT_AUCTION_FILTERS,
  parseOptionFilter,
  readAuctionFilters,
  toAuctionItemsRequest,
  toAuctionSearch,
  updateAuctionFilters,
} from "@/lib/auctionParams";
import { draftsToFilters } from "@/components/AuctionSearchForm";

const read = (query: string) => readAuctionFilters(new URLSearchParams(query));

describe("readAuctionFilters", () => {
  it("빈 쿼리면 기본 조건(보석, 즉시 구매가 낮은 순)을 돌려준다", () => {
    expect(read("")).toEqual(DEFAULT_AUCTION_FILTERS);
  });

  it("URL의 조건과 반복되는 opt를 읽는다", () => {
    expect(
      read(
        "category=200010&q=%20목걸이%20&grade=고대&tier=4&quality=90&opt=7.41.2.&opt=7.42..3&sort=ITEM_QUALITY&order=DESC&page=2",
      ),
    ).toEqual({
      category: 200010,
      query: "목걸이",
      grade: "고대",
      tier: 4,
      quality: 90,
      options: [
        { first: 7, second: 41, min: 2, max: null },
        { first: 7, second: 42, min: null, max: 3 },
      ],
      sort: "ITEM_QUALITY",
      order: "DESC",
      page: 2,
    });
  });

  it("손으로 고친 잘못된 값은 기본값으로 되돌리고 잘못된 옵션은 버린다", () => {
    const filters = read(
      "tier=99&quality=-1&sort=FOO&order=up&page=0&opt=abc&opt=1.2.x.&opt=3.4..",
    );
    expect(filters.tier).toBeNull();
    expect(filters.quality).toBeNull();
    expect(filters.sort).toBe("BUY_PRICE");
    expect(filters.order).toBe("ASC");
    expect(filters.page).toBe(1);
    expect(filters.options).toEqual([{ first: 3, second: 4, min: null, max: null }]);
  });

  it("옵션 조건은 최대 3개까지만 읽는다", () => {
    expect(read("opt=1.1..&opt=1.2..&opt=1.3..&opt=1.4..").options).toHaveLength(3);
  });
});

describe("parseOptionFilter", () => {
  it("네 칸이 아니면 버린다", () => {
    expect(parseOptionFilter("1.2")).toBeNull();
    expect(parseOptionFilter("1.2.3.4.5")).toBeNull();
  });
});

describe("toAuctionSearch", () => {
  it("기본값은 빼고 항상 같은 순서로 만들어 읽은 값과 왕복한다", () => {
    const filters = read("opt=7.41.2.&quality=70&q=겁화&tier=4");
    const search = toAuctionSearch(filters);
    expect(search).toBe(`q=${encodeURIComponent("겁화")}&tier=4&quality=70&opt=7.41.2.`);
    expect(read(search)).toEqual(filters);
  });

  it("기본 조건이면 빈 문자열이다", () => {
    expect(toAuctionSearch(DEFAULT_AUCTION_FILTERS)).toBe("");
  });
});

describe("updateAuctionFilters", () => {
  const onPage3 = { ...DEFAULT_AUCTION_FILTERS, page: 3 };

  it("조건이 바뀌면 1페이지로 돌아간다", () => {
    expect(updateAuctionFilters(onPage3, { tier: 4 }).page).toBe(1);
    expect(updateAuctionFilters(onPage3, { options: [] }).page).toBe(1);
  });

  it("페이지만 바꾸면 그 페이지로 간다", () => {
    expect(updateAuctionFilters(onPage3, { page: 4 }).page).toBe(4);
  });
});

describe("toAuctionItemsRequest", () => {
  it("비어 있는 조건은 요청 본문에 넣지 않는다", () => {
    expect(toAuctionItemsRequest(DEFAULT_AUCTION_FILTERS)).toEqual({
      CategoryCode: 210000,
      Sort: "BUY_PRICE",
      SortCondition: "ASC",
      PageNo: 1,
    });
  });

  it("옵션 조건을 EtcOptions로 바꾸고, 비운 범위는 null로 보낸다", () => {
    const request = toAuctionItemsRequest(
      read("tier=4&quality=0&grade=유물&opt=7.41.2."),
    );
    expect(request).toMatchObject({
      ItemTier: 4,
      ItemGradeQuality: 0,
      ItemGrade: "유물",
      EtcOptions: [{ FirstOption: 7, SecondOption: 41, MinValue: 2, MaxValue: null }],
    });
  });
});

describe("draftsToFilters", () => {
  it("1·2단계를 모두 고른 줄만 조건으로 만들고, 뒤집힌 범위는 바로잡는다", () => {
    expect(
      draftsToFilters([
        { first: 7, second: null, min: "", max: "" },
        { first: 7, second: 41, min: "5", max: "2" },
        { first: 8, second: 1, min: "abc", max: "" },
      ]),
    ).toEqual([
      { first: 7, second: 41, min: 2, max: 5 },
      { first: 8, second: 1, min: null, max: null },
    ]);
  });
});
