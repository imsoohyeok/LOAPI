import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const profile = {
  CharacterName: "본캐",
  ServerName: "루페온",
  CharacterClassName: "바드",
  ItemAvgLevel: "1,680.00",
  CombatPower: "2,345.67",
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

// limiter가 모듈 범위 상태라서, 테스트마다 모듈을 새로 불러와 깨끗한 상태로 시작합니다.
async function loadLostark() {
  vi.resetModules();
  return import("@/lib/lostark");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  vi.stubEnv("LOSTARK_API_KEY", "test-key");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("로스트아크 API 요청", () => {
  it("429를 받으면 초기화 시각까지 기다렸다가 다시 보낸다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 429, { "X-RateLimit-Reset": "3" }))
      .mockResolvedValueOnce(jsonResponse(profile));
    vi.stubGlobal("fetch", fetchMock);
    const { getProfile } = await loadLostark();

    const result = getProfile("본캐");
    await vi.advanceTimersByTimeAsync(2_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toMatchObject({ CombatPower: "2,345.67" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("한 요청이 429를 받으면 대기 중인 다른 요청도 함께 멈춘다", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.includes("first") && fetchMock.mock.calls.length === 1
          ? jsonResponse(null, 429, { "X-RateLimit-Reset": "2" })
          : jsonResponse(profile),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { getProfile } = await loadLostark();

    void getProfile("first");
    await vi.advanceTimersByTimeAsync(0);
    void getProfile("second");
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("재시도 횟수를 다 쓰면 RATE_LIMITED 에러를 던진다", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(null, 429)));
    vi.stubGlobal("fetch", fetchMock);
    const { getProfile } = await loadLostark();

    const result = getProfile("본캐").catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await result).toMatchObject({ code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("기다려야 하는 시간이 너무 길면 재시도하지 않고 바로 실패한다", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(null, 429, { "X-RateLimit-Reset": "50" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { getProfile } = await loadLostark();

    await expect(getProfile("본캐")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("멈춘 시간이 길면 대기 중인 요청도 붙잡지 않고 바로 실패시킨다", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(null, 429, { "X-RateLimit-Reset": "50" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { getProfile } = await loadLostark();

    await expect(getProfile("첫번째")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    await expect(getProfile("두번째")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("404는 재시도 없이 NOT_FOUND로 바꾼다", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(null, 404)));
    vi.stubGlobal("fetch", fetchMock);
    const { getProfile } = await loadLostark();

    await expect(getProfile("없는캐릭")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
