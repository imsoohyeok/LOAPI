import { describe, it, expect, beforeEach } from "vitest";
import { getTrackedSummaries } from "@/lib/storage";

function seed(name: string, value: unknown) {
  window.localStorage.setItem(`lostark-tracker:${name}`, JSON.stringify(value));
}

describe("getTrackedSummaries", () => {
  beforeEach(() => window.localStorage.clear());

  it("기록이 없으면 빈 배열을 반환한다", () => {
    expect(getTrackedSummaries()).toEqual([]);
  });

  it("캐릭터마다 가장 최근 기록과 기록 수를 요약한다", () => {
    seed("바드", [
      { date: "2026-10-03", itemLevel: 1680 },
      { date: "2026-10-01", itemLevel: 1675 },
    ]);
    expect(getTrackedSummaries()).toEqual([
      { name: "바드", latest: { date: "2026-10-03", itemLevel: 1680 }, count: 2 },
    ]);
  });

  it("마지막 기록일이 최근인 캐릭터부터, 같으면 이름순으로 정렬한다", () => {
    seed("나", [{ date: "2026-10-01", itemLevel: 1640 }]);
    seed("다", [{ date: "2026-10-05", itemLevel: 1600 }]);
    seed("가", [{ date: "2026-10-05", itemLevel: 1700 }]);
    expect(getTrackedSummaries().map((s) => s.name)).toEqual(["가", "다", "나"]);
  });

  it("비어 있거나 깨진 기록과 트래커가 아닌 키는 건너뛴다", () => {
    seed("빈캐릭", []);
    window.localStorage.setItem("lostark-tracker:깨진캐릭", "{not json");
    window.localStorage.setItem("other-app", "[]");
    seed("정상", [{ date: "2026-10-01", itemLevel: 1640 }]);
    expect(getTrackedSummaries().map((s) => s.name)).toEqual(["정상"]);
  });
});
