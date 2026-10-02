import { describe, it, expect } from "vitest";
import { ProfileSchema, CharacterDataSchema, RawSiblingsSchema } from "@/lib/types";

describe("ProfileSchema", () => {
  it("올바른 형태의 프로필 데이터를 통과시킨다", () => {
    const valid = {
      CharacterName: "홍길동",
      ServerName: "루페온",
      CharacterClassName: "바드",
      ItemAvgLevel: "1620.00",
    };
    expect(() => ProfileSchema.parse(valid)).not.toThrow();
  });

  it("필드가 누락되면 검증에 실패한다", () => {
    const invalid = { CharacterName: "홍길동" };
    expect(() => ProfileSchema.parse(invalid)).toThrow();
  });
});

describe("CharacterDataSchema", () => {
  it("전체 캐릭터 데이터 구조를 검증한다", () => {
    const valid = {
      profile: {
        CharacterName: "홍길동",
        ServerName: "루페온",
        CharacterClassName: "바드",
        ItemAvgLevel: "1620.00",
      },
      equipment: [{ Type: "무기", Name: "테스트 무기" }],
      engravings: { Engravings: [{ Name: "원한", Level: 3 }] },
      gems: { Gems: [] },
    };
    expect(() => CharacterDataSchema.parse(valid)).not.toThrow();
  });
});

describe("RawSiblingsSchema", () => {
  it("원정대 캐릭터 목록을 통과시킨다", () => {
    const valid = [
      {
        ServerName: "루페온",
        CharacterName: "홍길동",
        CharacterLevel: 70,
        CharacterClassName: "바드",
        ItemAvgLevel: "1,640.00",
      },
    ];
    expect(() => RawSiblingsSchema.parse(valid)).not.toThrow();
  });

  it("존재하지 않는 캐릭터일 때 오는 null도 허용한다", () => {
    expect(RawSiblingsSchema.parse(null)).toBeNull();
  });
});
