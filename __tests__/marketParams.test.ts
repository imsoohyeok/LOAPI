import { describe, it, expect } from "vitest";
import {
  DEFAULT_MARKET_FILTERS,
  readMarketFilters,
  toMarketItemsRequest,
  toMarketSearch,
  toggleSort,
  updateMarketFilters,
} from "@/lib/marketParams";

const read = (query: string) => readMarketFilters(new URLSearchParams(query));

describe("readMarketFilters", () => {
  it("빈 쿼리면 기본 조건을 돌려준다", () => {
    expect(read("")).toEqual(DEFAULT_MARKET_FILTERS);
  });

  it("URL의 조건을 읽는다", () => {
    expect(
      read("category=40000&q=%20원한%20&grade=유물&sort=RECENT_PRICE&order=ASC&page=3"),
    ).toEqual({
      category: 40000,
      query: "원한",
      grade: "유물",
      sort: "RECENT_PRICE",
      order: "ASC",
      page: 3,
    });
  });

  it("잘못된 값은 오류 대신 기본값으로 되돌린다", () => {
    expect(read("category=-1&sort=CHEAP&order=up&page=0")).toEqual(
      DEFAULT_MARKET_FILTERS,
    );
    expect(read("page=1.5").page).toBe(1);
    expect(read("page=99999").page).toBe(1);
    expect(read("grade=%20%20").grade).toBeNull();
  });

  it("검색어는 30자로 자른다", () => {
    expect(read(`q=${"가".repeat(40)}`).query).toHaveLength(30);
  });
});

describe("toMarketSearch", () => {
  it("기본값은 URL에서 빼서 짧게 만든다", () => {
    expect(toMarketSearch(DEFAULT_MARKET_FILTERS)).toBe("");
    expect(toMarketSearch({ ...DEFAULT_MARKET_FILTERS, query: "파괴석" })).toBe(
      `q=${encodeURIComponent("파괴석")}`,
    );
  });

  it("읽기와 쓰기를 왕복하면 같은 조건이 된다", () => {
    const filters = {
      category: 50010,
      query: "돌파석",
      grade: "희귀",
      sort: "GRADE" as const,
      order: "ASC" as const,
      page: 4,
    };
    expect(read(toMarketSearch(filters))).toEqual(filters);
  });
});

describe("updateMarketFilters", () => {
  const onPage3 = { ...DEFAULT_MARKET_FILTERS, page: 3 };

  it("페이지만 바꾸면 다른 조건은 그대로 둔다", () => {
    expect(updateMarketFilters(onPage3, { page: 4 })).toEqual({ ...onPage3, page: 4 });
  });

  it("다른 조건이 바뀌면 1페이지로 돌아간다", () => {
    expect(updateMarketFilters(onPage3, { grade: "전설" }).page).toBe(1);
    expect(updateMarketFilters(onPage3, { query: "각인서" }).page).toBe(1);
  });
});

describe("toggleSort", () => {
  it("같은 기준을 다시 누르면 방향을 뒤집는다", () => {
    expect(toggleSort({ sort: "RECENT_PRICE", order: "DESC" }, "RECENT_PRICE")).toEqual({
      sort: "RECENT_PRICE",
      order: "ASC",
    });
  });

  it("다른 기준을 누르면 내림차순부터 시작한다", () => {
    expect(toggleSort({ sort: "RECENT_PRICE", order: "ASC" }, "GRADE")).toEqual({
      sort: "GRADE",
      order: "DESC",
    });
  });
});

describe("toMarketItemsRequest", () => {
  it("로스트아크 API 요청 본문으로 바꾼다", () => {
    expect(
      toMarketItemsRequest({ ...DEFAULT_MARKET_FILTERS, query: "파괴석", grade: "희귀" }),
    ).toEqual({
      CategoryCode: 50000,
      Sort: "CURRENT_MIN_PRICE",
      SortCondition: "DESC",
      PageNo: 1,
      ItemName: "파괴석",
      ItemGrade: "희귀",
    });
  });

  it("검색어·등급이 없으면 해당 필드를 아예 보내지 않는다", () => {
    const body = toMarketItemsRequest(DEFAULT_MARKET_FILTERS);
    expect(body).not.toHaveProperty("ItemName");
    expect(body).not.toHaveProperty("ItemGrade");
  });
});
