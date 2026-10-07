import type { CacheMeta } from "@/lib/types";

// 서버 메모리 캐시(lib/cache.ts)와 클라이언트 쿼리 캐시(lib/queryClient.ts)가 같이 쓰는 TTL입니다.
// 서버 전용 모듈에 두면 클라이언트가 가져올 수 없어서, 아무 런타임에서나 읽을 수 있는 이 파일에 둡니다.
export const CACHE_TTL_MS = 5 * 60 * 1000;

// 화면에서 쓰는 캐시 정보. fetchedAt은 로스트아크 API에서 데이터를 받아온 시각을
// 이 브라우저의 시계로 환산한 값이라, 브라우저의 Date.now()와 바로 빼서 쓸 수 있습니다.
export interface CacheInfo {
  fromCache: boolean;
  fetchedAt: number;
}

export type WithCacheInfo<T> = T & { cacheInfo: CacheInfo | null };

// 서버가 보낸 경과 시간(ageMs)을 응답을 받은 시각에서 빼서 브라우저 기준 시각으로 바꿉니다.
// 두 값 중 하나라도 없으면(구버전 응답 등) 모르는 것으로 보고 배지를 그리지 않습니다.
export function toCacheInfo(meta: CacheMeta, receivedAt: number): CacheInfo | null {
  if (meta.fromCache === undefined || meta.ageMs === undefined) return null;
  return { fromCache: meta.fromCache, fetchedAt: receivedAt - meta.ageMs };
}

export interface CacheStatus {
  label: string;
  age: string;
  description: string;
}

const relativeTime = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
const TTL_MINUTES = CACHE_TTL_MS / 60_000;

// "방금", "3분 전", "1시간 전". 분 단위로 내림해서 4분 59초도 "4분 전"으로 보여줍니다.
export function formatAge(ageMs: number): string {
  const minutes = Math.floor(Math.max(0, ageMs) / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return relativeTime.format(-minutes, "minute");
  return relativeTime.format(-Math.floor(minutes / 60), "hour");
}

export function describeCacheStatus(info: CacheInfo, now: number): CacheStatus {
  const ttlNote = `같은 캐릭터는 ${TTL_MINUTES}분 동안 저장된 응답을 다시 써요.`;
  return {
    label: info.fromCache ? "서버 캐시" : "새로 조회",
    age: formatAge(now - info.fetchedAt),
    description: info.fromCache
      ? `${TTL_MINUTES}분 안에 같은 캐릭터를 조회한 기록이 있어서, 로스트아크 API를 다시 부르지 않고 서버에 저장된 응답을 보여줘요.`
      : `로스트아크 API에서 직접 받아온 응답이에요. ${ttlNote}`,
  };
}
