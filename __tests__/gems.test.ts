import { describe, it, expect } from "vitest";
import { averageGemLevel, buildGemViews, getGemKind, stripHtml } from "@/lib/gems";
import { RawGemsSchema } from "@/lib/types";

describe("stripHtml", () => {
  it("API가 보내는 FONT 태그를 제거한다", () => {
    expect(stripHtml("<FONT COLOR='#F99200'>10레벨 겁화의 보석</FONT>")).toBe(
      "10레벨 겁화의 보석",
    );
  });
});

describe("getGemKind", () => {
  it("보석 이름으로 종류를 구분한다", () => {
    expect(getGemKind("10레벨 겁화의 보석")).toBe("damage");
    expect(getGemKind("7레벨 멸화의 보석")).toBe("damage");
    expect(getGemKind("8레벨 작열의 보석")).toBe("cooldown");
    expect(getGemKind("5레벨 홍염의 보석")).toBe("cooldown");
    expect(getGemKind("알 수 없는 보석")).toBe("other");
  });
});

describe("buildGemViews", () => {
  const gems = {
    Gems: [
      { Slot: 0, Name: "<FONT>8레벨 작열의 보석</FONT>", Level: 8, Grade: "유물" },
      { Slot: 1, Name: "<FONT>7레벨 겁화의 보석</FONT>", Level: 7, Grade: "유물" },
      { Slot: 2, Name: "<FONT>10레벨 겁화의 보석</FONT>", Level: 10, Grade: "고대" },
    ],
    Skills: [{ GemSlot: 2, Name: "체인 소드" }],
  };

  it("피해 보석을 먼저, 같은 종류는 레벨 내림차순으로 정렬한다", () => {
    const views = buildGemViews(gems);
    expect(views.map((v) => v.level)).toEqual([10, 7, 8]);
  });

  it("슬롯 번호로 적용 스킬을 연결한다", () => {
    const views = buildGemViews(gems);
    expect(views[0]?.skillName).toBe("체인 소드");
    expect(views[1]?.skillName).toBeNull();
  });

  it("평균 레벨을 계산한다", () => {
    expect(averageGemLevel(buildGemViews(gems))).toBeCloseTo(25 / 3);
    expect(averageGemLevel([])).toBeNull();
  });
});

describe("RawGemsSchema", () => {
  it("Effects 형태가 예상과 달라도 보석 목록은 살린다", () => {
    const parsed = RawGemsSchema.parse({
      Gems: [{ Name: "10레벨 겁화의 보석", Level: 10 }],
      Effects: [{ GemSlot: 0, Name: "옛날 형식", Description: "..." }],
    });
    expect(parsed?.Gems).toHaveLength(1);
    expect(parsed?.Effects).toBeNull();
  });
});
