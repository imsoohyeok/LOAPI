import { describe, it, expect } from "vitest";
import { readTrackerName, trackerHref, withTrackerName } from "@/lib/trackerParams";

describe("readTrackerName", () => {
  it("name 쿼리에서 앞뒤 공백을 뺀 캐릭터 이름을 읽는다", () => {
    expect(readTrackerName(new URLSearchParams("name=+바드+"))).toBe("바드");
  });

  it("없거나 공백뿐이면 null이다", () => {
    expect(readTrackerName(new URLSearchParams(""))).toBeNull();
    expect(readTrackerName(new URLSearchParams("name=%20"))).toBeNull();
  });
});

describe("withTrackerName", () => {
  it("다른 쿼리는 유지한 채 name만 바꾼다", () => {
    const next = new URLSearchParams(
      withTrackerName(new URLSearchParams("name=바드&ref=home"), "소서리스"),
    );
    expect(next.get("name")).toBe("소서리스");
    expect(next.get("ref")).toBe("home");
  });

  it("빈 이름이면 name을 지운다", () => {
    expect(withTrackerName(new URLSearchParams("name=바드"), " ")).toBe("");
  });
});

describe("trackerHref", () => {
  it("한글 이름을 인코딩한 트래커 주소를 만든다", () => {
    expect(trackerHref("바드")).toBe(`/tracker?name=${encodeURIComponent("바드")}`);
  });
});
