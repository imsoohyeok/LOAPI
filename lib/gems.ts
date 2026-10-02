import type { Gems } from "@/lib/types";

// 겁화/멸화는 스킬 피해 증가, 작열/홍염은 재사용 대기시간 감소 보석입니다.
export type GemKind = "damage" | "cooldown" | "other";

export const GEM_KIND_LABEL: Record<GemKind, string> = {
  damage: "피해",
  cooldown: "쿨감",
  other: "기타",
};

const DAMAGE_GEMS = ["겁화", "멸화"];
const COOLDOWN_GEMS = ["작열", "홍염"];

export interface GemView {
  key: string;
  name: string;
  level: number | null;
  grade: string | null;
  icon: string | null;
  kind: GemKind;
  skillName: string | null;
}

export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getGemKind(name: string): GemKind {
  if (DAMAGE_GEMS.some((g) => name.includes(g))) return "damage";
  if (COOLDOWN_GEMS.some((g) => name.includes(g))) return "cooldown";
  return "other";
}

const KIND_ORDER: Record<GemKind, number> = { damage: 0, cooldown: 1, other: 2 };

// 보석과 적용 스킬을 슬롯 번호로 묶고, 종류(피해 → 쿨감) · 레벨 내림차순으로 정렬합니다.
export function buildGemViews(gems: Gems): GemView[] {
  const skillBySlot = new Map(gems.Skills.map((skill) => [skill.GemSlot, skill]));

  return gems.Gems.map((gem, idx) => {
    const name = stripHtml(gem.Name);
    const skill = gem.Slot != null ? skillBySlot.get(gem.Slot) : undefined;
    return {
      key: `${gem.Slot ?? "x"}-${idx}`,
      name,
      level: gem.Level ?? null,
      grade: gem.Grade ?? null,
      icon: gem.Icon ?? null,
      kind: getGemKind(name),
      skillName: skill ? stripHtml(skill.Name) : null,
    };
  }).sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || (b.level ?? 0) - (a.level ?? 0),
  );
}

export function averageGemLevel(views: GemView[]): number | null {
  const levels = views.map((v) => v.level).filter((l): l is number => l !== null);
  if (levels.length === 0) return null;
  return levels.reduce((sum, l) => sum + l, 0) / levels.length;
}
