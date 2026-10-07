import { describe, it, expect } from "vitest";
import { compareTitle, readCompareNames, withCompareName } from "@/lib/compareParams";

describe("readCompareNames", () => {
  it("a, b 쿼리에서 두 캐릭터 이름을 읽는다", () => {
    const params = new URLSearchParams("a=%EB%B3%B8%EC%BA%90&b=%EB%B6%80%EC%BA%90");
    expect(readCompareNames(params)).toEqual({ a: "본캐", b: "부캐" });
  });

  it("없거나 공백뿐인 값은 null로 본다", () => {
    expect(readCompareNames(new URLSearchParams("a=%20%20"))).toEqual({
      a: null,
      b: null,
    });
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(readCompareNames(new URLSearchParams("b=+본캐+")).b).toBe("본캐");
  });
});

describe("withCompareName", () => {
  it("다른 쪽 이름과 다른 쿼리는 유지한 채 한쪽만 바꾼다", () => {
    const params = new URLSearchParams("a=본캐&b=부캐&ref=discord");
    const next = new URLSearchParams(withCompareName(params, "a", "새캐"));
    expect(next.get("a")).toBe("새캐");
    expect(next.get("b")).toBe("부캐");
    expect(next.get("ref")).toBe("discord");
  });

  it("빈 이름이면 해당 쿼리를 지운다", () => {
    const params = new URLSearchParams("a=본캐&b=부캐");
    expect(withCompareName(params, "b", "  ")).toBe("a=%EB%B3%B8%EC%BA%90");
  });

  it("원래 URLSearchParams는 바꾸지 않는다", () => {
    const params = new URLSearchParams("a=본캐");
    withCompareName(params, "a", "새캐");
    expect(params.get("a")).toBe("본캐");
  });
});

describe("compareTitle", () => {
  it("두 이름이 있으면 'A vs B' 형식이다", () => {
    expect(compareTitle({ a: "본캐", b: "부캐" })).toBe("본캐 vs 부캐");
  });

  it("한쪽만 있으면 그 이름, 둘 다 없으면 null이다", () => {
    expect(compareTitle({ a: null, b: "부캐" })).toBe("부캐");
    expect(compareTitle({ a: null, b: null })).toBeNull();
  });
});
