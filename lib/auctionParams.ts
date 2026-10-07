import { AUCTION_SORTS, type AuctionSort, type SortCondition } from "@/lib/auction";

// 경매장 검색 조건도 거래소(lib/marketParams.ts)처럼 URL 쿼리에만 저장합니다.
// ?category=&q=&grade=&tier=&quality=&opt=&sort=&order=&page=
// 거래소와 파일을 나눈 이유: 경매장에는 티어·품질·옵션 조건이 더 있고 정렬 기준도 달라서,
// 하나의 타입으로 합치면 양쪽 모두 "이 페이지에선 안 쓰는 필드"를 들고 다니게 됩니다.

// 기타 옵션 조건 한 줄. first/second는 /auctions/options의 EtcOptions[].Value와 EtcSubs[].Value입니다.
export interface AuctionOptionFilter {
  first: number;
  second: number;
  min: number | null;
  max: number | null;
}

export interface AuctionFilters {
  category: number;
  query: string;
  grade: string | null;
  tier: number | null;
  quality: number | null;
  options: AuctionOptionFilter[];
  sort: AuctionSort;
  order: SortCondition;
  page: number;
}

// 보석(210000)을 기본으로 둡니다. 경매장에서 가장 자주 찾는 품목이고, 결과가 바로 보여야
// 처음 들어온 사용자가 이 페이지가 무엇을 하는지 알 수 있습니다.
// 정렬은 "가장 싼 매물부터"가 경매장의 기본 사용 방식이라 즉시 구매가 오름차순입니다.
export const DEFAULT_AUCTION_FILTERS: AuctionFilters = {
  category: 210000,
  query: "",
  grade: null,
  tier: null,
  quality: null,
  options: [],
  sort: "BUY_PRICE",
  order: "ASC",
  page: 1,
};

// 옵션 조건이 많을수록 동적 폼이 길어지고 결과가 0건이 되기 쉬워서, 실제 게임 UI처럼 몇 줄로 제한합니다.
export const MAX_OPTION_FILTERS = 3;
const MAX_QUERY_LENGTH = 30;
const MAX_PAGE = 1000;

function intInRange(
  value: string | null | undefined,
  min: number,
  max: number,
): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

function isSort(value: string | null): value is AuctionSort {
  return AUCTION_SORTS.some((sort) => sort.value === value);
}

// opt=7.1.3.5 → { first: 7, second: 1, min: 3, max: 5 }. 최솟값·최댓값은 비워 둘 수 있습니다(7.1..).
// 점(.)은 URL에서 인코딩되지 않아서 주소가 읽기 쉽게 남습니다.
export function parseOptionFilter(raw: string): AuctionOptionFilter | null {
  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [first, second, min, max] = parts;
  const firstCode = intInRange(first, 1, 999_999);
  const secondCode = intInRange(second, 1, 999_999);
  if (firstCode === null || secondCode === null) return null;
  const minValue = min ? intInRange(min, 0, 999_999) : null;
  const maxValue = max ? intInRange(max, 0, 999_999) : null;
  // 숫자가 아닌 값이 들어 있으면 조건 자체를 버립니다(빈 값과 구분).
  if ((min && minValue === null) || (max && maxValue === null)) return null;
  return { first: firstCode, second: secondCode, min: minValue, max: maxValue };
}

export function formatOptionFilter(option: AuctionOptionFilter): string {
  return [option.first, option.second, option.min ?? "", option.max ?? ""].join(".");
}

export function readAuctionFilters(
  params: Pick<URLSearchParams, "get" | "getAll">,
): AuctionFilters {
  const d = DEFAULT_AUCTION_FILTERS;
  const sort = params.get("sort");
  const order = params.get("order");
  const options = params
    .getAll("opt")
    .map(parseOptionFilter)
    .filter((option): option is AuctionOptionFilter => option !== null)
    .slice(0, MAX_OPTION_FILTERS);

  return {
    category: intInRange(params.get("category"), 1, 999_999) ?? d.category,
    query: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    grade: params.get("grade")?.trim() || null,
    tier: intInRange(params.get("tier"), 1, 9),
    quality: intInRange(params.get("quality"), 0, 100),
    options,
    sort: isSort(sort) ? sort : d.sort,
    order: order === "ASC" || order === "DESC" ? order : d.order,
    page: intInRange(params.get("page"), 1, MAX_PAGE) ?? d.page,
  };
}

// 기본값과 같은 항목은 빼고, 항목 순서를 고정해서 같은 조건이면 같은 URL(=같은 캐시 키)이 됩니다.
export function toAuctionSearch(filters: AuctionFilters): string {
  const d = DEFAULT_AUCTION_FILTERS;
  const params = new URLSearchParams();
  if (filters.category !== d.category) params.set("category", String(filters.category));
  if (filters.query) params.set("q", filters.query);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.tier !== null) params.set("tier", String(filters.tier));
  if (filters.quality !== null) params.set("quality", String(filters.quality));
  for (const option of filters.options) params.append("opt", formatOptionFilter(option));
  if (filters.sort !== d.sort) params.set("sort", filters.sort);
  if (filters.order !== d.order) params.set("order", filters.order);
  if (filters.page !== d.page) params.set("page", String(filters.page));
  return params.toString();
}

// 거래소와 같은 규칙: 페이지 외의 조건이 바뀌면 결과 목록이 달라지므로 1페이지로 돌아갑니다.
export function updateAuctionFilters(
  current: AuctionFilters,
  patch: Partial<AuctionFilters>,
): AuctionFilters {
  const next = { ...current, ...patch };
  const onlyPage = Object.keys(patch).every((key) => key === "page");
  return onlyPage ? next : { ...next, page: patch.page ?? 1 };
}

// 로스트아크 POST /auctions/items 요청 본문. 비어 있는 조건은 보내지 않아야 "전체"로 검색됩니다.
export interface AuctionItemsRequest {
  CategoryCode: number;
  Sort: AuctionSort;
  SortCondition: SortCondition;
  PageNo: number;
  ItemName?: string;
  ItemGrade?: string;
  ItemTier?: number;
  ItemGradeQuality?: number;
  EtcOptions?: {
    FirstOption: number;
    SecondOption: number;
    MinValue: number | null;
    MaxValue: number | null;
  }[];
}

export function toAuctionItemsRequest(filters: AuctionFilters): AuctionItemsRequest {
  return {
    CategoryCode: filters.category,
    Sort: filters.sort,
    SortCondition: filters.order,
    PageNo: filters.page,
    ...(filters.query && { ItemName: filters.query }),
    ...(filters.grade && { ItemGrade: filters.grade }),
    ...(filters.tier !== null && { ItemTier: filters.tier }),
    ...(filters.quality !== null && { ItemGradeQuality: filters.quality }),
    ...(filters.options.length > 0 && {
      EtcOptions: filters.options.map((option) => ({
        FirstOption: option.first,
        SecondOption: option.second,
        MinValue: option.min,
        MaxValue: option.max,
      })),
    }),
  };
}
