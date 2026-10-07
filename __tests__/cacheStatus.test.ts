import { describe, it, expect } from "vitest";
import { describeCacheStatus, formatAge, toCacheInfo } from "@/lib/cacheStatus";

const MINUTE = 60_000;

describe("toCacheInfo", () => {
  it("서버가 보낸 경과 시간을 브라우저 기준 조회 시각으로 바꾼다", () => {
    expect(toCacheInfo({ fromCache: true, ageMs: 3 * MINUTE }, 10 * MINUTE)).toEqual({
      fromCache: true,
      fetchedAt: 7 * MINUTE,
    });
  });

  it("캐시 정보가 빠진 응답이면 null을 돌려준다", () => {
    expect(toCacheInfo({}, 0)).toBeNull();
    expect(toCacheInfo({ fromCache: false }, 0)).toBeNull();
  });
});

describe("formatAge", () => {
  it("1분 미만은 '방금'으로 보여준다", () => {
    expect(formatAge(0)).toBe("방금");
    expect(formatAge(59_999)).toBe("방금");
  });

  it("분 단위로 내림해서 보여준다", () => {
    expect(formatAge(MINUTE)).toBe("1분 전");
    expect(formatAge(5 * MINUTE - 1)).toBe("4분 전");
  });

  it("1시간 이상은 시간 단위로 보여준다", () => {
    expect(formatAge(60 * MINUTE)).toBe("1시간 전");
    expect(formatAge(150 * MINUTE)).toBe("2시간 전");
  });

  it("시계 오차로 음수가 들어와도 '방금'으로 보여준다", () => {
    expect(formatAge(-5000)).toBe("방금");
  });
});

describe("describeCacheStatus", () => {
  it("서버 캐시 적중이면 캐시 라벨과 경과 시간을 돌려준다", () => {
    const status = describeCacheStatus({ fromCache: true, fetchedAt: 0 }, 3 * MINUTE);
    expect(status.label).toBe("서버 캐시");
    expect(status.age).toBe("3분 전");
  });

  it("새로 조회한 응답이면 조회 라벨을 돌려준다", () => {
    const status = describeCacheStatus({ fromCache: false, fetchedAt: 0 }, 1000);
    expect(status.label).toBe("새로 조회");
    expect(status.age).toBe("방금");
  });
});
