import { toCacheInfo, type WithCacheInfo } from "@/lib/cacheStatus";
import {
  CharacterDataSchema,
  RosterResponseSchema,
  type CharacterData,
  type Roster,
} from "@/lib/types";

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

// 쿼리 에러를 화면 문구로 바꿉니다. ApiError가 아니면 fetch 자체가 실패한 경우입니다.
export function toErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "네트워크 오류가 발생했습니다.";
}
