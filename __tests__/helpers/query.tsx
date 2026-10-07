import { vi } from "vitest";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 응답 순서를 테스트에서 직접 정할 수 있도록, fetch 호출마다 resolve를 붙잡아 둡니다.
export interface PendingRequest {
  url: string;
  signal: AbortSignal | undefined;
  respond: (body: unknown, status?: number) => void;
}

export function mockFetch(): PendingRequest[] {
  const requests: PendingRequest[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
        requests.push({
          url,
          signal: init?.signal ?? undefined,
          respond: (body, status = 200) =>
            resolve(new Response(JSON.stringify(body), { status })),
        });
      });
    }),
  );
  return requests;
}

// 테스트마다 캐시가 섞이지 않도록 새 QueryClient를 만들고, 재시도는 끕니다.
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));
