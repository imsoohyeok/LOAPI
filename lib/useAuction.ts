"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAuctionItems, fetchAuctionOptions, queryKeys } from "@/lib/api";
import {
  readAuctionFilters,
  toAuctionSearch,
  updateAuctionFilters,
  type AuctionFilters,
} from "@/lib/auctionParams";

// 거래소 훅(lib/useMarket.ts)과 같은 구조입니다. URL이 유일한 원본이고, 화면은 URL에서 조건을 읽습니다.
export function useAuctionFilters(): {
  filters: AuctionFilters;
  setFilters: (patch: Partial<AuctionFilters>) => void;
} {
  const searchParams = useSearchParams();
  const filters = useMemo(() => readAuctionFilters(searchParams), [searchParams]);

  function setFilters(patch: Partial<AuctionFilters>) {
    // 렌더 시점의 filters가 아니라 지금 URL에서 다시 읽어서, 연달아 바꿔도 앞의 변경이 사라지지 않습니다.
    const current = readAuctionFilters(new URLSearchParams(window.location.search));
    const query = toAuctionSearch(updateAuctionFilters(current, patch));
    window.history.pushState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }

  return { filters, setFilters };
}

export function useAuctionItems(filters: AuctionFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.auctionItems(filters),
    queryFn: ({ signal }) => fetchAuctionItems(filters, signal),
    // 페이지·조건이 바뀌는 동안 이전 결과를 흐리게 남겨 화면이 출렁이지 않게 합니다.
    placeholderData: keepPreviousData,
  });

  function prefetchPage(page: number) {
    const next = { ...filters, page };
    void queryClient.prefetchQuery({
      queryKey: queryKeys.auctionItems(next),
      queryFn: ({ signal }) => fetchAuctionItems(next, signal),
    });
  }

  return { ...query, prefetchPage };
}

export function useAuctionOptions() {
  return useQuery({
    queryKey: queryKeys.auctionOptions(),
    queryFn: ({ signal }) => fetchAuctionOptions(signal),
    // 카테고리·옵션 목록은 게임 업데이트 때나 바뀌므로 탭을 닫을 때까지 다시 받지 않습니다.
    staleTime: Infinity,
  });
}
