import "server-only";
import { z } from "zod";
import {
  ProfileSchema,
  RawEquipmentSchema,
  RawEngravingsSchema,
  RawGemsSchema,
  RawSiblingsSchema,
  type Profile,
  type Equipment,
  type Engravings,
  type Gems,
  type Roster,
} from "@/lib/types";
import {
  MarketItemsPageSchema,
  MarketOptionsSchema,
  type MarketItemsPage,
  type MarketOptions,
} from "@/lib/market";
import type { MarketItemsRequest } from "@/lib/marketParams";
import { normalizeEngravings } from "@/lib/engravings";
import {
  createRateLimiter,
  parseRateLimitHeaders,
  RateLimitWaitError,
  retryDelayMs,
} from "@/lib/rateLimiter";

const BASE_URL = "https://developer-lostark.game.onstove.com";

export class LostarkApiError extends Error {
  constructor(
    public code: "NOT_FOUND" | "RATE_LIMITED" | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "LostarkApiError";
  }
}

// 스키마 검증에 실패하면 실제 원본 응답을 그대로 터미널에 출력합니다.
// 이 로그를 보면 실제 필드명이 뭔지 정확히 알 수 있어요.
function parseOrLog<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  raw: unknown,
  label: string,
): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    console.error(`\n===== [${label}] 스키마 불일치 =====`);
    console.error("실제 API 응답 원본:");
    console.error(JSON.stringify(raw, null, 2));
    console.error("Zod 검증 오류 상세:");
    console.error(JSON.stringify(result.error.issues, null, 2));
    console.error("=====================================\n");
    throw result.error;
  }
  return result.data;
}

function getHeaders(): HeadersInit {
  const apiKey = process.env.LOSTARK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LOSTARK_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
    );
  }
  return {
    Authorization: `bearer ${apiKey}`,
    Accept: "application/json",
  };
}

// 공식 문서(developer-lostark.game.onstove.com/usage-guide) 기준 API 키당 분당 100회입니다.
// 동시 요청 수는 원정대 일괄 조회처럼 요청이 몰릴 때 로스트아크 서버와 이 서버의 소켓을
// 한꺼번에 점유하지 않을 정도로 둡니다. 4개 엔드포인트를 묶는 캐릭터 상세 조회 하나가 한 번에 나가는 수와 맞췄습니다.
const RATE_LIMIT_PER_MINUTE = 100;
const MAX_CONCURRENT_REQUESTS = 4;
// 429를 받았을 때 다시 시도하는 횟수와, 응답을 붙잡고 기다려도 되는 최대 시간입니다.
// 이보다 오래 기다려야 하면 사용자를 세워 두기보다 바로 "한도 초과"를 알리는 편이 낫습니다.
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 10_000;

// 모듈 범위에 하나만 둬서 이 서버 프로세스의 모든 라우트가 같은 한도를 나눠 씁니다.
const limiter = createRateLimiter({
  limit: RATE_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxConcurrent: MAX_CONCURRENT_REQUESTS,
  maxWaitMs: MAX_RETRY_WAIT_MS,
});

function scheduleLostark<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  return limiter.schedule(task, signal ?? undefined).catch((err: unknown) => {
    if (err instanceof RateLimitWaitError) {
      throw new LostarkApiError("RATE_LIMITED", "요청 한도를 초과했습니다.");
    }
    throw err;
  });
}

// 거래소 검색은 POST라서 init으로 method·body를 넘길 수 있게 합니다.
async function fetchLostark(path: string, init?: RequestInit): Promise<unknown> {
  for (let attempt = 0; ; attempt += 1) {
    // 본문을 다 읽을 때까지를 한 슬롯으로 봐야 동시성 제한이 실제 연결 수와 맞습니다.
    const { status, headers, body } = await scheduleLostark(async () => {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: { ...getHeaders(), ...init?.headers },
      });
      const json: unknown = res.ok ? await res.json() : null;
      return { status: res.status, headers: res.headers, body: json };
    }, init?.signal ?? undefined);

    const { remaining, resetAt } = parseRateLimitHeaders(headers);
    limiter.syncFromHeaders(remaining, resetAt);

    if (status === 429) {
      const now = Date.now();
      const delay = retryDelayMs(attempt, resetAt, now);
      // 한 요청이 429를 맞았다면 큐에 있는 다른 요청도 같은 결과를 받을 테니 모두 함께 멈춥니다.
      limiter.pauseUntil(now + delay);
      if (attempt >= MAX_RATE_LIMIT_RETRIES || delay > MAX_RETRY_WAIT_MS) {
        throw new LostarkApiError("RATE_LIMITED", "요청 한도를 초과했습니다.");
      }
      // 따로 잠들 필요 없이 다시 큐에 넣으면 limiter가 멈춘 시각까지 기다렸다가 보냅니다.
      continue;
    }
    if (status === 404) {
      throw new LostarkApiError("NOT_FOUND", "캐릭터를 찾을 수 없습니다.");
    }
    if (status < 200 || status >= 300) {
      throw new LostarkApiError("UNKNOWN", `로스트아크 API 오류: ${status}`);
    }
    return body;
  }
}

export async function getProfile(
  characterName: string,
  signal?: AbortSignal,
): Promise<Profile> {
  const raw = await fetchLostark(
    `/armories/characters/${encodeURIComponent(characterName)}/profiles`,
    { signal },
  );
  return parseOrLog(ProfileSchema, raw, "profiles");
}

export async function getEquipment(characterName: string): Promise<Equipment> {
  const raw = await fetchLostark(
    `/armories/characters/${encodeURIComponent(characterName)}/equipment`,
  );
  const parsed = parseOrLog(RawEquipmentSchema, raw, "equipment");
  return parsed ?? [];
}

export async function getEngravings(characterName: string): Promise<Engravings> {
  const raw = await fetchLostark(
    `/armories/characters/${encodeURIComponent(characterName)}/engravings`,
  );
  return normalizeEngravings(parseOrLog(RawEngravingsSchema, raw, "engravings"));
}

export async function getGems(characterName: string): Promise<Gems> {
  const raw = await fetchLostark(
    `/armories/characters/${encodeURIComponent(characterName)}/gems`,
  );
  const parsed = parseOrLog(RawGemsSchema, raw, "gems");
  return { Gems: parsed?.Gems ?? [], Skills: parsed?.Effects?.Skills ?? [] };
}

// 존재하지 않는 캐릭터면 404 대신 200 + null(또는 빈 배열)이 오므로 직접 NOT_FOUND로 바꿉니다.
export async function getSiblings(characterName: string): Promise<Roster> {
  const raw = await fetchLostark(
    `/characters/${encodeURIComponent(characterName)}/siblings`,
  );
  const parsed = parseOrLog(RawSiblingsSchema, raw, "siblings");
  if (!parsed || parsed.length === 0) {
    throw new LostarkApiError("NOT_FOUND", "캐릭터를 찾을 수 없습니다.");
  }
  return parsed;
}

export async function getMarketOptions(): Promise<MarketOptions> {
  const raw = await fetchLostark("/markets/options");
  return parseOrLog(MarketOptionsSchema, raw, "markets/options");
}

export async function searchMarketItems(
  request: MarketItemsRequest,
): Promise<MarketItemsPage> {
  const raw = await fetchLostark("/markets/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return parseOrLog(MarketItemsPageSchema, raw, "markets/items");
}

export async function getFullCharacterData(characterName: string) {
  const [profile, equipment, engravings, gems] = await Promise.all([
    getProfile(characterName).catch(rethrowWithContext("profiles")),
    getEquipment(characterName).catch(rethrowWithContext("equipment")),
    getEngravings(characterName).catch(rethrowWithContext("engravings")),
    getGems(characterName).catch(rethrowWithContext("gems")),
  ]);

  return { profile, equipment, engravings, gems };
}

function rethrowWithContext(endpoint: string) {
  return (err: unknown): never => {
    if (err instanceof Error) {
      console.error(`[${endpoint}] 응답 처리 실패:`, err.message);
    }
    throw err;
  };
}
