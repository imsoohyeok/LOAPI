import { describe, it, expect } from "vitest";
import { parseItemLevel } from "@/lib/utils";

describe("parseItemLevel", () => {
  it("쉼표가 포함된 숫자 문자열을 파싱한다", () => {
    expect(parseItemLevel("1,680.00")).toBe(1680);
  });

  it("일반 숫자 문자열을 파싱한다", () => {
    expect(parseItemLevel("1620.42")).toBeCloseTo(1620.42);
  });

  it("잘못된 값은 0을 반환한다", () => {
    expect(parseItemLevel("알수없음")).toBe(0);
  });
});
