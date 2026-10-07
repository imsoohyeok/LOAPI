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

// 거래소 검색은 POST라서 init으로 method·body를 넘길 수 있게 합니다.
async function fetchLostark(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
  });

  if (res.status === 404) {
    throw new LostarkApiError("NOT_FOUND", "캐릭터를 찾을 수 없습니다.");
  }
  if (res.status === 429) {
    throw new LostarkApiError("RATE_LIMITED", "요청 한도를 초과했습니다.");
  }
  if (!res.ok) {
    throw new LostarkApiError("UNKNOWN", `로스트아크 API 오류: ${res.status}`);
  }
  return res.json();
}

export async function getProfile(characterName: string): Promise<Profile> {
  const raw = await fetchLostark(
    `/armories/characters/${encodeURIComponent(characterName)}/profiles`,
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
