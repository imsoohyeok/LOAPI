import { z } from "zod";
import { CacheMetaSchema } from "@/lib/types";
import type { SortCondition } from "@/lib/market";

// 경매장 API(/auctions/*) 응답 스키마. 거래소(/markets/*)와 엔드포인트·요청·응답이 모두 다릅니다.
// 거래소는 같은 물건이 묶음으로 쌓이는 품목(재료·각인서)이라 "시세"가 있고,
// 경매장은 장신구·보석처럼 물건마다 옵션이 달라서 매물 하나하나가 결과 한 줄입니다.

// 기타 옵션(EtcOptions)의 2단계 항목. 예: "보석 효과"(1단계) → "피해 증가"(2단계).
// EtcValues는 연마 효과처럼 고를 수 있는 값이 정해진 옵션에만 옵니다. 형태가 바뀌어도
// 검색 화면 전체가 깨지지 않도록, 예상과 다르면 버리고 숫자 직접 입력으로 대신합니다.
const AuctionEtcSubSchema = z.object({
  Value: z.number(),
  Text: z.string(),
  Class: z.string().nullish(),
  EtcValues: z
    .array(z.object({ DisplayValue: z.string(), Value: z.number() }))
    .nullish()
    .catch(null),
});
export type AuctionEtcSub = z.infer<typeof AuctionEtcSubSchema>;

const AuctionEtcOptionSchema = z.object({
  Value: z.number(),
  Text: z.string(),
  EtcSubs: z
    .array(AuctionEtcSubSchema)
    .nullish()
    .transform((subs) => subs ?? []),
});
export type AuctionEtcOption = z.infer<typeof AuctionEtcOptionSchema>;

const AuctionCategorySchema = z.object({
  Code: z.number(),
  CodeName: z.string(),
  Subs: z
    .array(z.object({ Code: z.number(), CodeName: z.string() }))
    .nullish()
    .transform((subs) => subs ?? []),
});

const list = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .array(schema)
    .nullish()
    .transform((items) => items ?? []);

// GET /auctions/options. 스킬(트라이포드) 옵션·직업 목록도 오지만 v1 화면에서는 쓰지 않아서 뺐습니다.
export const AuctionOptionsSchema = z.object({
  Categories: z.array(AuctionCategorySchema),
  ItemGrades: list(z.string()),
  ItemTiers: list(z.number()),
  ItemGradeQualities: list(z.number()),
  EtcOptions: list(AuctionEtcOptionSchema),
});
export type AuctionOptions = z.infer<typeof AuctionOptionsSchema>;

// 매물에 붙은 옵션 한 줄(장신구 연마 효과, 보석 효과, 각인 등).
const AuctionItemOptionSchema = z.object({
  Type: z.string(),
  OptionName: z.string(),
  Value: z.number(),
  IsPenalty: z.boolean().nullish(),
  IsValuePercentage: z.boolean().nullish(),
});
export type AuctionItemOption = z.infer<typeof AuctionItemOptionSchema>;

// 즉시 구매가가 없는 매물(입찰만 가능)은 BuyPrice가 null입니다.
const AuctionInfoSchema = z.object({
  StartPrice: z.number(),
  BuyPrice: z.number().nullish(),
  BidPrice: z.number(),
  EndDate: z.string(),
  BidCount: z.number(),
  BidStartPrice: z.number(),
  IsCompetitive: z.boolean().nullish(),
  TradeAllowCount: z.number().nullish(),
  UpgradeLevel: z.number().nullish(),
});

// 거래소와 달리 매물에 Id가 없습니다. 같은 이름의 매물이 여러 개일 수 있어서 화면 key는 따로 만듭니다.
export const AuctionItemSchema = z.object({
  Name: z.string(),
  Grade: z.string(),
  Tier: z.number().nullish(),
  Level: z.number().nullish(),
  Icon: z.string().nullish(),
  GradeQuality: z.number().nullish(),
  AuctionInfo: AuctionInfoSchema,
  Options: list(AuctionItemOptionSchema),
});
export type AuctionItem = z.infer<typeof AuctionItemSchema>;

export const AuctionItemsPageSchema = z.object({
  PageNo: z.number(),
  PageSize: z.number(),
  TotalCount: z.number(),
  Items: list(AuctionItemSchema),
});
export type AuctionItemsPage = z.infer<typeof AuctionItemsPageSchema>;

export const AuctionItemsResponseSchema = AuctionItemsPageSchema.merge(CacheMetaSchema);
export const AuctionOptionsResponseSchema = AuctionOptionsSchema.merge(CacheMetaSchema);

// 로스트아크 API가 받는 정렬 기준. 화면에는 자주 쓰는 순서로 보여줍니다.
export const AUCTION_SORTS = [
  { value: "BUY_PRICE", label: "즉시 구매가" },
  { value: "BIDSTART_PRICE", label: "경매 시작가" },
  { value: "EXPIREDATE", label: "마감 임박" },
  { value: "ITEM_QUALITY", label: "품질" },
  { value: "ITEM_GRADE", label: "등급" },
  { value: "ITEM_LEVEL", label: "아이템 레벨" },
] as const;
export type AuctionSort = (typeof AUCTION_SORTS)[number]["value"];
export type { SortCondition };

// 매물 목록의 React key. Id가 없어서 화면에 보이는 값 중 매물마다 달라지는 것들을 묶습니다.
// 그래도 완전히 같은 매물이 둘이면 겹칠 수 있으므로 목록 위치(index)를 끝에 붙입니다.
export function auctionItemKey(item: AuctionItem, index: number): string {
  return `${item.Name}|${item.AuctionInfo.EndDate}|${item.AuctionInfo.BidStartPrice}|${index}`;
}

// 매물 옵션을 "피해 증가 +44%"처럼 읽기 쉬운 한 줄로 만듭니다. 감소 옵션(IsPenalty)은 부호를 바꿉니다.
const optionValueFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });
export function formatAuctionOption(option: AuctionItemOption): string {
  const sign = option.IsPenalty ? "-" : "+";
  const unit = option.IsValuePercentage ? "%" : "";
  return `${option.OptionName} ${sign}${optionValueFormatter.format(option.Value)}${unit}`;
}

// 마감까지 남은 시간. 서버 시계가 아니라 사용자가 보는 시점(now) 기준으로 대략 보여줍니다.
// EndDate는 시간대 표기 없이 한국 시간으로 오므로(+09:00) 직접 붙여서 읽습니다.
export function parseAuctionEndDate(endDate: string): number | null {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(endDate);
  const time = Date.parse(hasZone ? endDate : `${endDate}+09:00`);
  return Number.isNaN(time) ? null : time;
}

export function formatTimeLeft(endDate: string, now: number): string {
  const end = parseAuctionEndDate(endDate);
  if (end === null) return "-";
  const minutes = Math.floor((end - now) / 60_000);
  if (minutes <= 0) return "곧 마감";
  if (minutes < 60) return `${minutes}분 남음`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 남음`;
  return `${Math.floor(hours / 24)}일 남음`;
}
