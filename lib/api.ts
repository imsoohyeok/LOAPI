import { toCacheInfo, type WithCacheInfo } from "@/lib/cacheStatus";
import {
  CharacterDataSchema,
  ProfileResponseSchema,
  RosterResponseSchema,
  type CharacterData,
  type Profile,
  type Roster,
} from "@/lib/types";
import {
  MarketItemsResponseSchema,
  MarketOptionsResponseSchema,
  type MarketItemsPage,
  type MarketOptions,
} from "@/lib/market";
import { toMarketSearch, type MarketFilters } from "@/lib/marketParams";

// API 라우트가 돌려준 에러. status로 재시도 여부를 판단하고, message는 화면에 그대로 보여줍니다.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 쿼리 키를 한곳에서 만들어서, 같은 데이터를 다른 페이지에서 조회해도 키가 어긋나지 않게 합니다.
export const queryKeys = {
  character: (name: string) => ["character", name] as const,
  roster: (name: string) => ["roster", name] as const,
  profile: (name: string) => ["profile", name] as const,
  // 필터 객체를 키에 그대로 넣습니다. React Query는 객체 키를 속성 순서와 무관하게 해시하므로
  // 조건이 같으면 같은 캐시를 쓰고, 하나라도 다르면 별도 캐시가 됩니다.
  marketItems: (filters: MarketFilters) => ["market", "items", filters] as const,
  marketOptions: () => ["market", "options"] as const,
};

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  // 프록시가 HTML 에러 페이지를 돌려주는 경우처럼 본문이 JSON이 아닐 수도 있습니다.
  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof json.error === "string"
        ? json.error
        : "알 수 없는 오류가 발생했습니다.";
    throw new ApiError(message, res.status);
  }
  return json;
}

export async function fetchCharacter(
  name: string,
  signal?: AbortSignal,
): Promise<WithCacheInfo<CharacterData>> {
  const json = await getJson(`/api/character/${encodeURIComponent(name)}`, signal);
  const parsed = CharacterDataSchema.safeParse(json);
  if (!parsed.success) throw new ApiError("서버 응답 형식이 예상과 다릅니다.", 200);
  return { ...parsed.data, cacheInfo: toCacheInfo(parsed.data, Date.now()) };
}

export async function fetchRoster(
  name: string,
  signal?: AbortSignal,
): Promise<WithCacheInfo<{ roster: Roster }>> {
  const json = await getJson(
    `/api/character/${encodeURIComponent(name)}/siblings`,
    signal,
  );
  const parsed = RosterResponseSchema.safeParse(json);
  if (!parsed.success) throw new ApiError("서버 응답 형식이 예상과 다릅니다.", 200);
  return { roster: parsed.data.roster, cacheInfo: toCacheInfo(parsed.data, Date.now()) };
}

export async function fetchProfile(name: string, signal?: AbortSignal): Promise<Profile> {
  const json = await getJson(
    `/api/character/${encodeURIComponent(name)}/profile`,
    signal,
  );
  const parsed = ProfileResponseSchema.safeParse(json);
  if (!parsed.success) throw new ApiError("서버 응답 형식이 예상과 다릅니다.", 200);
  return parsed.data.profile;
}

export async function fetchMarketItems(
  filters: MarketFilters,
  signal?: AbortSignal,
): Promise<MarketItemsPage> {
  const json = await getJson(`/api/market/items?${toMarketSearch(filters)}`, signal);
  const parsed = MarketItemsResponseSchema.safeParse(json);
  if (!parsed.success) throw new ApiError("서버 응답 형식이 예상과 다릅니다.", 200);
  return parsed.data;
}

export async function fetchMarketOptions(signal?: AbortSignal): Promise<MarketOptions> {
  const json = await getJson("/api/market/options", signal);
  const parsed = MarketOptionsResponseSchema.safeParse(json);
  if (!parsed.success) throw new ApiError("서버 응답 형식이 예상과 다릅니다.", 200);
  return parsed.data;
}

// 쿼리 에러를 화면 문구로 바꿉니다. ApiError가 아니면 fetch 자체가 실패한 경우입니다.
export function toErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "네트워크 오류가 발생했습니다.";
}
