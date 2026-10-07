// 서버 메모리 캐시(lib/cache.ts)와 클라이언트 쿼리 캐시(lib/queryClient.ts)가 같이 쓰는 TTL입니다.
// 서버 전용 모듈에 두면 클라이언트가 가져올 수 없어서, 아무 런타임에서나 읽을 수 있는 이 파일에 둡니다.
export const CACHE_TTL_MS = 5 * 60 * 1000;
