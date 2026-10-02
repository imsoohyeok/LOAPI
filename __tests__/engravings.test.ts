import { describe, it, expect } from "vitest";
import { normalizeEngravings } from "@/lib/engravings";
import { RawEngravingsSchema } from "@/lib/types";

describe("normalizeEngravings", () => {
  it("아크 패시브 각인을 등급·스톤 레벨과 함께 정규화한다", () => {
    const raw = RawEngravingsSchema.parse({
      Engravings: null,
      Effects: null,
      ArkPassiveEffects: [
        {
          AbilityStoneLevel: 2,
          Grade: "유물",
          Level: 4,
          Name: "원한",
          Description: "...",
        },
        {
          AbilityStoneLevel: null,
          Grade: "전설",
          Level: 3,
          Name: "돌격대장",
          Description: "...",
        },
      ],
    });
    expect(normalizeEngravings(raw).Engravings).toEqual([
      { Name: "원한", Level: 4, Grade: "유물", AbilityStoneLevel: 2 },
      { Name: "돌격대장", Level: 3, Grade: "전설", AbilityStoneLevel: null },
    ]);
  });

  it("구 Effects의 'Lv. N' 이름을 이름과 레벨로 분리한다", () => {
    const raw = RawEngravingsSchema.parse({
      Effects: [{ Name: "원한 Lv. 3", Description: "" }, { Name: "아드레날린" }],
    });
    expect(normalizeEngravings(raw).Engravings).toEqual([
      { Name: "원한", Level: 3 },
      { Name: "아드레날린", Level: null },
    ]);
  });

  it("응답이 null이면 빈 목록을 돌려준다", () => {
    expect(normalizeEngravings(null).Engravings).toEqual([]);
  });
});
