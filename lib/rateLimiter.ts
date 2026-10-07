// 로스트아크 API 요청을 내보내는 관문입니다. 두 가지를 동시에 지킵니다.
// 1) 동시성 제한: 한 번에 maxConcurrent개까지만 실제로 요청을 보냅니다.
// 2) 분당 한도: 최근 windowMs 동안 시작한 요청이 limit개면, 가장 오래된 요청이 창을 벗어날 때까지 기다립니다.
// 한도는 API 키 단위라서 브라우저가 아니라 키를 가진 서버에서 지켜야 모든 사용자의 요청을 함께 셀 수 있습니다.
// 시계와 타이머를 주입받게 해서 테스트에서 가짜 시간으로 검증합니다. 서버 전용 코드에 의존하지 않습니다.

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxConcurrent: number;
  // 다음 요청을 보낼 수 있을 때까지 이보다 오래 기다려야 하면 큐에 있는 작업을 모두 실패시킵니다.
  // 서버 라우트가 응답을 1분씩 붙잡고 있기보다 "한도 초과"를 바로 알려야 사용자가 상황을 알 수 있습니다.
  maxWaitMs?: number;
  now?: () => number;
}

export class RateLimitWaitError extends Error {
  constructor(public readonly waitMs: number) {
    super(`요청 한도 때문에 ${waitMs}ms를 기다려야 합니다.`);
    this.name = "RateLimitWaitError";
  }
}

export interface RateLimiter {
  // signal이 취소되면 아직 큐에서 기다리는 작업은 보내지 않고 빼냅니다. 사용자가 다른 원정대를
  // 검색해 이전 요청이 쓸모없어졌을 때 한도를 낭비하지 않기 위해서입니다.
  schedule<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T>;
  // 서버가 알려준 남은 요청 수와 초기화 시각으로 로컬 계산을 보정합니다.
  syncFromHeaders(remaining: number | null, resetAt: number | null): void;
  // 429를 받았을 때처럼 until(ms)까지 새 요청을 보내지 않습니다.
  pauseUntil(until: number): void;
  readonly pending: number;
  readonly active: number;
}

interface QueuedTask {
  run: () => void;
  reject: (reason: unknown) => void;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxConcurrent,
  maxWaitMs = Infinity,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const queue: QueuedTask[] = [];
  // 최근 windowMs 안에 시작한 요청들의 시작 시각(오름차순). 고정 창(매분 0초 초기화) 대신
  // 슬라이딩 창으로 세서, 창 경계에 요청이 몰려 순간적으로 한도의 두 배가 나가는 일을 막습니다.
  const startedAt: number[] = [];
  let active = 0;
  let pausedUntil = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function msUntilAvailable(): number {
    const t = now();
    while (startedAt.length > 0 && startedAt[0]! <= t - windowMs) startedAt.shift();
    const windowWait = startedAt.length >= limit ? startedAt[0]! + windowMs - t : 0;
    return Math.max(windowWait, pausedUntil - t, 0);
  }

  function pump() {
    while (queue.length > 0 && active < maxConcurrent) {
      const wait = msUntilAvailable();
      if (wait > maxWaitMs) {
        for (const task of queue.splice(0)) task.reject(new RateLimitWaitError(wait));
        return;
      }
      if (wait > 0) {
        // 타이머는 하나만 둡니다. 대기 중인 요청이 몇 개든 깨어나는 시점은 같기 때문입니다.
        if (timer === null) {
          timer = setTimeout(() => {
            timer = null;
            pump();
          }, wait);
        }
        return;
      }
      const task = queue.shift()!;
      active += 1;
      startedAt.push(now());
      task.run();
    }
  }

  return {
    schedule<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        if (signal?.aborted) {
          reject(signal.reason);
          return;
        }
        const onAbort = () => {
          const index = queue.indexOf(entry);
          if (index === -1) return;
          queue.splice(index, 1);
          reject(signal!.reason);
        };
        const entry: QueuedTask = {
          run: () => {
            signal?.removeEventListener("abort", onAbort);
            task()
              .then(resolve, reject)
              .finally(() => {
                active -= 1;
                pump();
              });
          },
          reject,
        };
        signal?.addEventListener("abort", onAbort, { once: true });
        queue.push(entry);
        pump();
      });
    },

    syncFromHeaders(remaining, resetAt) {
      // 같은 키를 쓰는 다른 서버 인스턴스나 프로세스 재시작으로 로컬 계산이 실제보다 후할 수 있습니다.
      // 서버가 0이라고 하면 그 말을 믿고 초기화 시각까지 멈춥니다.
      // 서버 시계와 이 서버의 시계가 어긋나 있으면 초기화 시각이 터무니없이 멀 수 있어서, 창 하나 길이로 자릅니다.
      if (remaining !== null && remaining <= 0 && resetAt !== null) {
        this.pauseUntil(Math.min(resetAt, now() + windowMs));
      }
    },

    pauseUntil(until) {
      if (until <= pausedUntil) return;
      pausedUntil = until;
      // 이미 걸린 타이머가 더 이른 시점이면 깨어나서 다시 계산하므로 그대로 둡니다.
    },

    get pending() {
      return queue.length;
    },
    get active() {
      return active;
    },
  };
}

// 429 재시도 대기 시간. 서버가 초기화 시각을 알려주면 그때까지 기다리고, 없으면
// 지수 백오프에 지터를 섞어 여러 요청이 같은 순간에 다시 몰리지 않게 합니다.
// 지터를 [base/2, base] 범위로 둔 이유는 0에 가까운 대기로 바로 다시 429를 맞는 일을 줄이기 위해서입니다.
export const MAX_RETRY_DELAY_MS = 60_000;

export function retryDelayMs(
  attempt: number,
  resetAt: number | null,
  now: number,
  random: () => number = Math.random,
): number {
  if (resetAt !== null && resetAt > now) {
    return Math.min(resetAt - now, MAX_RETRY_DELAY_MS);
  }
  const base = 500 * 2 ** attempt;
  return Math.min(Math.round(base / 2 + random() * (base / 2)), MAX_RETRY_DELAY_MS);
}

// X-RateLimit-Reset은 초 단위 UNIX 시각입니다. 숫자가 아니면 모르는 것으로 봅니다.
export function parseRateLimitHeaders(headers: Headers): {
  remaining: number | null;
  resetAt: number | null;
} {
  const remaining = Number.parseInt(headers.get("X-RateLimit-Remaining") ?? "", 10);
  const reset = Number.parseInt(headers.get("X-RateLimit-Reset") ?? "", 10);
  return {
    remaining: Number.isNaN(remaining) ? null : remaining,
    resetAt: Number.isNaN(reset) ? null : reset * 1000,
  };
}
