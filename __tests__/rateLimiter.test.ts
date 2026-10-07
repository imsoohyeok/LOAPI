import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createRateLimiter,
  parseRateLimitHeaders,
  retryDelayMs,
  MAX_RETRY_DELAY_MS,
  RateLimitWaitError,
} from "@/lib/rateLimiter";

// 바깥에서 resolve할 수 있는 작업. 요청이 "진행 중"인 상태를 테스트에서 붙잡아 둡니다.
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("동시에 maxConcurrent개까지만 실행하고, 끝나는 대로 다음 작업을 시작한다", async () => {
    const limiter = createRateLimiter({ limit: 100, windowMs: 60_000, maxConcurrent: 2 });
    const tasks = [deferred(), deferred(), deferred()];
    const started: number[] = [];

    tasks.forEach((task, i) =>
      limiter.schedule(() => {
        started.push(i);
        return task.promise;
      }),
    );

    expect(started).toEqual([0, 1]);
    expect(limiter.pending).toBe(1);

    tasks[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual([0, 1, 2]);
  });

  it("창 안에서 한도만큼 시작했으면 가장 오래된 요청이 창을 벗어날 때까지 기다린다", async () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000, maxConcurrent: 10 });
    const started: number[] = [];
    const run = (i: number) =>
      limiter.schedule(async () => {
        started.push(i);
      });

    void run(0);
    await vi.advanceTimersByTimeAsync(300);
    void run(1);
    void run(2);
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual([0, 1]);

    // 첫 요청이 0ms에 시작했으니 1,000ms가 지나야 자리가 납니다.
    await vi.advanceTimersByTimeAsync(699);
    expect(started).toEqual([0, 1]);
    await vi.advanceTimersByTimeAsync(1);
    expect(started).toEqual([0, 1, 2]);
  });

  it("들어온 순서대로 실행한다", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 100, maxConcurrent: 1 });
    const started: string[] = [];
    for (const name of ["a", "b", "c"]) {
      void limiter.schedule(async () => {
        started.push(name);
      });
    }
    await vi.advanceTimersByTimeAsync(300);
    expect(started).toEqual(["a", "b", "c"]);
  });

  it("pauseUntil이 걸리면 그 시각까지 새 작업을 보내지 않는다", async () => {
    const limiter = createRateLimiter({ limit: 100, windowMs: 60_000, maxConcurrent: 5 });
    limiter.pauseUntil(2_000);
    const task = vi.fn(async () => "ok");

    const result = limiter.schedule(task);
    await vi.advanceTimersByTimeAsync(1_999);
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe("ok");
  });

  it("타이머가 걸린 뒤에 멈춤 시각이 늘어나도 늘어난 시각까지 기다린다", async () => {
    const limiter = createRateLimiter({ limit: 100, windowMs: 60_000, maxConcurrent: 5 });
    limiter.pauseUntil(1_000);
    const task = vi.fn(async () => undefined);
    void limiter.schedule(task);

    limiter.pauseUntil(3_000);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(task).toHaveBeenCalledOnce();
  });

  it("서버가 남은 요청이 0이라고 하면 초기화 시각까지 멈추되, 창 길이를 넘기지 않는다", async () => {
    const limiter = createRateLimiter({ limit: 100, windowMs: 60_000, maxConcurrent: 5 });
    // 서버 시계가 크게 어긋나 초기화 시각이 10분 뒤로 오는 경우
    limiter.syncFromHeaders(0, 600_000);
    const task = vi.fn(async () => undefined);
    void limiter.schedule(task);

    await vi.advanceTimersByTimeAsync(59_999);
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledOnce();
  });

  it("기다릴 시간이 maxWaitMs를 넘으면 대기 중인 작업을 모두 실패시킨다", async () => {
    const limiter = createRateLimiter({
      limit: 100,
      windowMs: 60_000,
      maxConcurrent: 5,
      maxWaitMs: 1_000,
    });
    limiter.pauseUntil(5_000);
    const task = vi.fn(async () => undefined);

    await expect(limiter.schedule(task)).rejects.toBeInstanceOf(RateLimitWaitError);
    expect(task).not.toHaveBeenCalled();
    expect(limiter.pending).toBe(0);
  });

  it("작업이 실패해도 슬롯을 돌려주고 에러를 그대로 전달한다", async () => {
    const limiter = createRateLimiter({ limit: 100, windowMs: 60_000, maxConcurrent: 1 });
    const failed = limiter.schedule(async () => {
      throw new Error("boom");
    });
    const next = limiter.schedule(async () => "next");

    await expect(failed).rejects.toThrow("boom");
    await expect(next).resolves.toBe("next");
    expect(limiter.active).toBe(0);
  });
});

describe("retryDelayMs", () => {
  it("초기화 시각을 알면 그때까지 기다린다", () => {
    expect(retryDelayMs(0, 5_000, 1_000)).toBe(4_000);
  });

  it("초기화 시각이 너무 멀면 최대 대기 시간으로 자른다", () => {
    expect(retryDelayMs(0, 10 * 60_000, 0)).toBe(MAX_RETRY_DELAY_MS);
  });

  it("초기화 시각이 없거나 지났으면 지수 백오프에 지터를 섞는다", () => {
    expect(retryDelayMs(0, null, 0, () => 0)).toBe(250);
    expect(retryDelayMs(0, null, 0, () => 1)).toBe(500);
    expect(retryDelayMs(2, 500, 1_000, () => 1)).toBe(2_000);
  });
});

describe("parseRateLimitHeaders", () => {
  it("남은 요청 수와 초 단위 초기화 시각을 밀리초로 바꾼다", () => {
    const headers = new Headers({
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1700000060",
    });
    expect(parseRateLimitHeaders(headers)).toEqual({
      remaining: 0,
      resetAt: 1_700_000_060_000,
    });
  });

  it("헤더가 없으면 null을 돌려준다", () => {
    expect(parseRateLimitHeaders(new Headers())).toEqual({
      remaining: null,
      resetAt: null,
    });
  });
});
