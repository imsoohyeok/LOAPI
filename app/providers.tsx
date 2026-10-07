"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";

export default function Providers({ children }: { children: ReactNode }) {
  // 모듈 최상단에서 만들면 서버에서는 여러 사용자의 요청이 같은 캐시를 공유하게 됩니다.
  // useState 초기화 함수로 만들면 컴포넌트 인스턴스마다 한 번만 생성되고 리렌더에도 유지됩니다.
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
