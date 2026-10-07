import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

// 서버의 메모리 캐시(lib/cache.ts) TTL과 같은 값입니다. 이 시간 안에 다시 요청해도
// 서버는 캐시된 응답을 돌려주므로, 클라이언트도 그동안은 네트워크를 타지 않습니다.
export const STALE_TIME_MS = 5 * 60 * 1000;

const MAX_RETRIES = 1;

// 4xx(없는 캐릭터, 요청 한도 초과, 응답 형식 오류)는 다시 보내도 결과가 같거나
// 한도만 더 소모하므로 재시도하지 않고, 네트워크 오류와 5xx만 한 번 더 시도합니다.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiError) return error.status >= 500;
  return true;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: shouldRetry,
        // 캐릭터 정보는 몇 분 사이에 바뀌지 않는데, 탭을 오갈 때마다 다시 요청하면
        // 로스트아크 API 분당 요청 한도만 깎아 먹습니다.
        refetchOnWindowFocus: false,
      },
    },
  });
}
