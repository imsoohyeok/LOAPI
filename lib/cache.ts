import "server-only";
import { CACHE_TTL_MS } from "@/lib/cacheStatus";

export interface CacheEntry<T> {
  value: T;
  // 로스트아크 API에서 값을 받아온 시각(서버 시계 기준). 응답의 ageMs를 계산할 때 씁니다.
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): CacheEntry<T> | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry as CacheEntry<T>;
}

export function setCached<T>(key: string, value: T): CacheEntry<T> {
  const entry = { value, timestamp: Date.now() };
  store.set(key, entry);
  return entry;
}

// 응답에 실어 보낼 캐시 메타데이터. 시각(timestamp) 대신 경과 시간(ageMs)을 보내는 이유는
// 서버와 브라우저의 시계가 서로 다를 수 있어서입니다. 시각을 그대로 넘기면 브라우저가 자기 시계로
// 빼야 하는데, 두 시계가 1분만 어긋나도 "방금 받은 데이터"가 "1분 전"으로 보입니다.
export function cacheMeta(entry: CacheEntry<unknown>, fromCache: boolean) {
  return { fromCache, ageMs: Math.max(0, Date.now() - entry.timestamp) };
}
