import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api";
import { shouldRetry } from "@/lib/queryClient";

describe("shouldRetry", () => {
  it("4xx 에러는 재시도하지 않는다", () => {
    expect(shouldRetry(0, new ApiError("없음", 404))).toBe(false);
    expect(shouldRetry(0, new ApiError("한도 초과", 429))).toBe(false);
  });

  it("5xx와 네트워크 오류는 한 번만 재시도한다", () => {
    expect(shouldRetry(0, new ApiError("서버 오류", 502))).toBe(true);
    expect(shouldRetry(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetry(1, new TypeError("Failed to fetch"))).toBe(false);
  });
});
