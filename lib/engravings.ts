import type { Engraving, Engravings, RawEngravings } from "@/lib/types";

// "원한 Lv. 3" → { Name: "원한", Level: 3 }
const EFFECT_NAME_PATTERN = /^(.*?)\s*Lv\.\s*(\d+)$/;

function parseEffectName(raw: string): Engraving {
  const match = raw.trim().match(EFFECT_NAME_PATTERN);
  const [, name, level] = match ?? [];
  if (!name || !level) return { Name: raw.trim(), Level: null };
  return { Name: name, Level: Number(level) };
}

/**
 * /engravings 응답을 화면용 목록 하나로 정규화합니다.
 * 우선순위: ArkPassiveEffects(현행) → Effects(구 각인 활성 효과) → Engravings(구 각인서 슬롯).
 * 구 Engravings는 레벨 정보가 없어서 마지막 대안으로만 씁니다.
 */
export function normalizeEngravings(raw: RawEngravings): Engravings {
  if (raw?.ArkPassiveEffects?.length) {
    return {
      Engravings: raw.ArkPassiveEffects.map((e) => ({
        Name: e.Name,
        Level: e.Level ?? null,
        Grade: e.Grade ?? null,
        AbilityStoneLevel: e.AbilityStoneLevel ?? null,
      })),
    };
  }
  if (raw?.Effects?.length) {
    return { Engravings: raw.Effects.map((e) => parseEffectName(e.Name)) };
  }
  return {
    Engravings: (raw?.Engravings ?? []).map((e) => ({ Name: e.Name, Level: null })),
  };
}
