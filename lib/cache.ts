import "server-only";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

const TTL_MS = 5 * 60 * 1000; // 5분
const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, { value, timestamp: Date.now() });
}
