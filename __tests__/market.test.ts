import { describe, it, expect } from "vitest";
import { MarketItemsPageSchema, priceChangeRate, totalPages } from "@/lib/market";
import { pageWindow } from "@/components/Pagination";

describe("MarketItemsPageSchema", () => {
  it("검색 결과가 없어 Items가 null이면 빈 배열로 바꾼다", () => {
    const parsed = MarketItemsPageSchema.parse({
      PageNo: 1,
      PageSize: 10,
      TotalCount: 0,
      Items: null,
    });
    expect(parsed.Items).toEqual([]);
  });
});

describe("totalPages", () => {
  it("전체 개수를 페이지 크기로 나눠 올림한다", () => {
    expect(totalPages({ TotalCount: 21, PageSize: 10 })).toBe(3);
    expect(totalPages({ TotalCount: 20, PageSize: 10 })).toBe(2);
  });

  it("결과가 없어도 최소 1페이지다", () => {
    expect(totalPages({ TotalCount: 0, PageSize: 10 })).toBe(1);
  });
});

describe("priceChangeRate", () => {
  it("전일 평균가 대비 현재 최저가의 변화율(%)을 구한다", () => {
    expect(priceChangeRate(110, 100)).toBeCloseTo(10);
    expect(priceChangeRate(90, 100)).toBeCloseTo(-10);
  });

  it("전일 거래가 없으면 비교하지 않는다", () => {
    expect(priceChangeRate(100, 0)).toBeNull();
  });
});

describe("pageWindow", () => {
  it("현재 페이지를 가운데에 둔다", () => {
    expect(pageWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
  });

  it("양 끝에서는 창을 안쪽으로 민다", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });

  it("전체 페이지가 창보다 적으면 전부 보여준다", () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
});
