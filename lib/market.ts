import { z } from "zod";

// 거래소 API(/markets/*) 응답 스키마. 서버 프록시와 클라이언트가 같은 스키마로 검증합니다.

// GET /markets/options: 카테고리 트리와 등급 목록. 화면의 필터 선택지가 여기서 나옵니다.
// 각인 옵션·직업 같은 다른 필드도 오지만 지금은 쓰지 않으므로 스키마에 넣지 않습니다(zod가 버립니다).
const MarketCategorySchema = z.object({
  Code: z.number(),
  CodeName: z.string(),
  Subs: z
    .array(z.object({ Code: z.number(), CodeName: z.string() }))
    .nullish()
    .transform((subs) => subs ?? []),
});
export type MarketCategory = z.infer<typeof MarketCategorySchema>;

export const MarketOptionsSchema = z.object({
  Categories: z.array(MarketCategorySchema),
  ItemGrades: z
    .array(z.string())
    .nullish()
    .transform((grades) => grades ?? []),
});
export type MarketOptions = z.infer<typeof MarketOptionsSchema>;

// POST /markets/items 응답의 아이템 한 줄. 가격은 묶음(BundleCount개) 단위 골드이고,
// 전일 평균가는 소수점이 붙어서 옵니다. TradeRemainCount는 거래 횟수 제한이 없는 아이템이면 null입니다.
export const MarketItemSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Grade: z.string(),
  Icon: z.string().nullish(),
  BundleCount: z.number(),
  TradeRemainCount: z.number().nullish(),
  YDayAvgPrice: z.number(),
  RecentPrice: z.number(),
  CurrentMinPrice: z.number(),
});
export type MarketItem = z.infer<typeof MarketItemSchema>;

// 검색 결과가 없으면 Items가 null로 올 수 있어서 빈 배열로 바꿉니다.
export const MarketItemsPageSchema = z.object({
  PageNo: z.number(),
  PageSize: z.number(),
  TotalCount: z.number(),
  Items: z
    .array(MarketItemSchema)
    .nullish()
    .transform((items) => items ?? []),
});
export type MarketItemsPage = z.infer<typeof MarketItemsPageSchema>;

// 프록시가 클라이언트에 돌려주는 형태. 다른 라우트처럼 fromCache를 같이 담습니다.
export const MarketItemsResponseSchema = MarketItemsPageSchema.extend({
  fromCache: z.boolean().optional(),
});
export const MarketOptionsResponseSchema = MarketOptionsSchema.extend({
  fromCache: z.boolean().optional(),
});

export const MARKET_SORTS = [
  { value: "CURRENT_MIN_PRICE", label: "현재 최저가" },
  { value: "RECENT_PRICE", label: "최근 거래가" },
  { value: "YDAY_AVG_PRICE", label: "전일 평균가" },
  { value: "GRADE", label: "등급" },
] as const;
export type MarketSort = (typeof MARKET_SORTS)[number]["value"];

export type SortCondition = "ASC" | "DESC";

export function totalPages(page: Pick<MarketItemsPage, "TotalCount" | "PageSize">) {
  if (page.PageSize <= 0) return 1;
  return Math.max(1, Math.ceil(page.TotalCount / page.PageSize));
}

// 현재 최저가가 전일 평균가보다 몇 % 높은지/낮은지. 전일 거래가 없으면(0) 비교할 수 없어 null입니다.
export function priceChangeRate(current: number, yesterdayAvg: number): number | null {
  if (yesterdayAvg <= 0 || current <= 0) return null;
  return ((current - yesterdayAvg) / yesterdayAvg) * 100;
}
