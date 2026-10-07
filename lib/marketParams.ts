import { MARKET_SORTS, type MarketSort, type SortCondition } from "@/lib/market";

// 거래소 검색 조건은 URL 쿼리(?category=&q=&grade=&sort=&order=&page=)에 저장합니다.
// 비교 페이지(?a=&b=)와 같은 이유로 URL이 유일한 원본이라서, 링크 공유·새로고침·뒤로가기가
// 모두 같은 화면을 보여줍니다. 서버 프록시도 같은 함수로 쿼리를 읽어서 기본값과 허용 범위가
// 클라이언트와 어긋날 일이 없습니다.
export interface MarketFilters {
  category: number;
  query: string;
  grade: string | null;
  sort: MarketSort;
  order: SortCondition;
  page: number;
}

// 강화 재료(50000)는 상위 카테고리라서 재련 재료·추가 재료 등을 한 번에 보여줍니다.
export const DEFAULT_MARKET_FILTERS: MarketFilters = {
  category: 50000,
  query: "",
  grade: null,
  sort: "CURRENT_MIN_PRICE",
  order: "DESC",
  page: 1,
};

const MAX_QUERY_LENGTH = 30;
const MAX_PAGE = 1000;

// 손으로 고친 링크(?page=abc, ?sort=foo)는 오류 대신 기본값으로 되돌립니다.
// 사용자가 보는 건 "망가진 페이지"가 아니라 "조건이 초기화된 페이지"가 됩니다.
function positiveInt(value: string | null, fallback: number, max: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const n = Number(value);
  return n >= 1 && n <= max ? n : fallback;
}

function isSort(value: string | null): value is MarketSort {
  return MARKET_SORTS.some((sort) => sort.value === value);
}

export function readMarketFilters(params: Pick<URLSearchParams, "get">): MarketFilters {
  const d = DEFAULT_MARKET_FILTERS;
  const sort = params.get("sort");
  const order = params.get("order");
  return {
    category: positiveInt(params.get("category"), d.category, 999_999),
    query: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    grade: params.get("grade")?.trim() || null,
    sort: isSort(sort) ? sort : d.sort,
    order: order === "ASC" || order === "DESC" ? order : d.order,
    page: positiveInt(params.get("page"), d.page, MAX_PAGE),
  };
}

// 기본값과 같은 항목은 빼서 /market?q=파괴석 처럼 짧은 URL을 만듭니다.
// 항목 순서가 항상 같아서, 같은 조건이면 같은 URL이 나옵니다.
export function toMarketSearch(filters: MarketFilters): string {
  const d = DEFAULT_MARKET_FILTERS;
  const params = new URLSearchParams();
  if (filters.category !== d.category) params.set("category", String(filters.category));
  if (filters.query) params.set("q", filters.query);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.sort !== d.sort) params.set("sort", filters.sort);
  if (filters.order !== d.order) params.set("order", filters.order);
  if (filters.page !== d.page) params.set("page", String(filters.page));
  return params.toString();
}

// 페이지 외의 조건이 바뀌면 결과 목록 자체가 달라지므로 1페이지로 돌아갑니다.
// (3페이지를 보다가 등급을 바꿨는데 새 결과가 2페이지뿐이면 빈 화면이 되기 때문)
export function updateMarketFilters(
  current: MarketFilters,
  patch: Partial<MarketFilters>,
): MarketFilters {
  const next = { ...current, ...patch };
  const onlyPage = Object.keys(patch).every((key) => key === "page");
  return onlyPage ? next : { ...next, page: patch.page ?? 1 };
}

// 로스트아크 POST /markets/items 요청 본문. 빈 검색어·등급은 아예 보내지 않아야 "전체"로 검색됩니다.
export interface MarketItemsRequest {
  CategoryCode: number;
  Sort: MarketSort;
  SortCondition: SortCondition;
  PageNo: number;
  ItemName?: string;
  ItemGrade?: string;
}

export function toMarketItemsRequest(filters: MarketFilters): MarketItemsRequest {
  return {
    CategoryCode: filters.category,
    Sort: filters.sort,
    SortCondition: filters.order,
    PageNo: filters.page,
    ...(filters.query && { ItemName: filters.query }),
    ...(filters.grade && { ItemGrade: filters.grade }),
  };
}

// 표 머리글 클릭: 지금 정렬 기준을 다시 누르면 방향만 뒤집고, 다른 기준이면 내림차순부터 시작합니다.
// (가격은 비싼 것부터, 등급은 높은 것부터 보는 경우가 많아서)
export function toggleSort(
  filters: Pick<MarketFilters, "sort" | "order">,
  sort: MarketSort,
): Pick<MarketFilters, "sort" | "order"> {
  if (filters.sort === sort) {
    return { sort, order: filters.order === "DESC" ? "ASC" : "DESC" };
  }
  return { sort, order: "DESC" };
}
