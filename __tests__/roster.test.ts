import { describe, it, expect } from "vitest";
import { groupRosterByServer, summarizeRoster } from "@/lib/roster";
import type { Sibling } from "@/lib/types";

function sibling(name: string, server: string, itemLevel: string): Sibling {
  return {
    CharacterName: name,
    ServerName: server,
    CharacterLevel: 70,
    CharacterClassName: "바드",
    ItemAvgLevel: itemLevel,
  };
}

const roster = [
  sibling("부캐1", "루페온", "1,610.00"),
  sibling("본캐", "루페온", "1,680.00"),
  sibling("카제캐", "카제로스", "1,700.00"),
  sibling("부캐2", "루페온", "1,640.50"),
];

describe("groupRosterByServer", () => {
  it("서버별로 묶고 서버 안에서는 아이템레벨 내림차순으로 정렬한다", () => {
    const groups = groupRosterByServer(roster);
    const rupeon = groups.find((g) => g.serverName === "루페온");
    expect(rupeon?.characters.map((c) => c.CharacterName)).toEqual([
      "본캐",
      "부캐2",
      "부캐1",
    ]);
  });

  it("서버끼리는 최고 아이템레벨 순으로 정렬한다", () => {
    const groups = groupRosterByServer(roster);
    expect(groups.map((g) => g.serverName)).toEqual(["카제로스", "루페온"]);
    expect(groups[0]?.maxItemLevel).toBe(1700);
  });

  it("빈 목록이면 빈 배열을 반환한다", () => {
    expect(groupRosterByServer([])).toEqual([]);
  });
});

describe("summarizeRoster", () => {
  it("총 인원, 평균, 최고, 기준 이상 캐릭터 수를 계산한다", () => {
    const summary = summarizeRoster(roster, 1640);
    expect(summary.total).toBe(4);
    expect(summary.averageItemLevel).toBeCloseTo(1657.625);
    expect(summary.highestItemLevel).toBe(1700);
    expect(summary.countAtOrAbove).toBe(3);
  });

  it("빈 목록이면 0으로 채운다", () => {
    expect(summarizeRoster([], 1640)).toEqual({
      total: 0,
      averageItemLevel: 0,
      highestItemLevel: 0,
      countAtOrAbove: 0,
    });
  });
});
