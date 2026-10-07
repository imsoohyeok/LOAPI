import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addSnapshot,
  deleteSnapshot,
  getTrackedSummaries,
  subscribeTracker,
} from "@/lib/storage";

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

describe("subscribeTracker", () => {
  beforeEach(() => window.localStorage.clear());

  it("저장·삭제하면 구독자에게 알리고, 해제하면 더 알리지 않는다", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTracker(listener);
    addSnapshot("바드", 1680);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    addSnapshot("바드", 1681);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("다른 탭의 트래커 키 변경과 clear만 알린다", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTracker(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: "other-app" }));
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent("storage", { key: "lostark-tracker:바드" }));
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

describe("deleteSnapshot", () => {
  beforeEach(() => window.localStorage.clear());

  it("마지막 기록을 지우면 키도 지운다", () => {
    seed("바드", [{ date: "2026-10-01", itemLevel: 1680 }]);
    expect(deleteSnapshot("바드", "2026-10-01")).toEqual([]);
    expect(window.localStorage.getItem("lostark-tracker:바드")).toBeNull();
  });
});
