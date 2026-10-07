"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMarketItems, fetchMarketOptions, queryKeys } from "@/lib/api";
import {
  readMarketFilters,
  toMarketSearch,
  updateMarketFilters,
  type MarketFilters,
} from "@/lib/marketParams";

export function useMarketFilters(): {
  filters: MarketFilters;
  setFilters: (patch: Partial<MarketFilters>) => void;
} {
  const searchParams = useSearchParams();
  // useSearchParams는 URL이 바뀔 때만 새 객체를 주므로, 그때만 다시 파싱합니다.
  const filters = useMemo(() => readMarketFilters(searchParams), [searchParams]);

  function setFilters(patch: Partial<MarketFilters>) {
    // 비교 페이지처럼 지금 URL에서 다시 읽어서, 연달아 바꿔도 앞의 변경이 사라지지 않게 합니다.
    const current = readMarketFilters(new URLSearchParams(window.location.search));
    const query = toMarketSearch(updateMarketFilters(current, patch));
    // pushState라서 뒤로가기로 이전 검색 조건·페이지로 돌아갈 수 있습니다.
    window.history.pushState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }

  return { filters, setFilters };
}

export function useMarketItems(filters: MarketFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.marketItems(filters),
    queryFn: ({ signal }) => fetchMarketItems(filters, signal),
    // 페이지를 넘기면 쿼리 키가 바뀌어 data가 잠깐 undefined가 됩니다. 그대로 두면 목록이
    // 사라졌다 나타나며 화면이 출렁이므로, 새 페이지가 올 때까지 이전 결과를 보여줍니다.
    // 이전 결과인지는 isPlaceholderData로 구분해서 흐리게 표시합니다.
    placeholderData: keepPreviousData,
  });

  // "다음" 버튼에 마우스를 올리거나 포커스하면 다음 페이지를 미리 받아 둡니다.
  // 클릭 시점엔 이미 캐시에 있어서 즉시 바뀝니다. 이미 받은 페이지는 staleTime 동안 다시 요청하지 않습니다.
  function prefetchPage(page: number) {
    const next = { ...filters, page };
    void queryClient.prefetchQuery({
      queryKey: queryKeys.marketItems(next),
      queryFn: ({ signal }) => fetchMarketItems(next, signal),
    });
  }

  return { ...query, prefetchPage };
}

export function useMarketOptions() {
  return useQuery({
    queryKey: queryKeys.marketOptions(),
    queryFn: ({ signal }) => fetchMarketOptions(signal),
    // 카테고리·등급 목록은 게임 업데이트 때나 바뀌므로, 한 번 받으면 탭을 닫을 때까지 다시 받지 않습니다.
    staleTime: Infinity,
  });
}
