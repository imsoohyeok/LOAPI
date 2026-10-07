"use client";

import MarketSearchForm from "@/components/MarketSearchForm";
import MarketItemTable from "@/components/MarketItemTable";
import Pagination from "@/components/Pagination";
import { toErrorMessage } from "@/lib/api";
import { totalPages } from "@/lib/market";
import { toggleSort, toMarketSearch } from "@/lib/marketParams";
import { useMarketFilters, useMarketItems, useMarketOptions } from "@/lib/useMarket";

export default function MarketView() {
  const { filters, setFilters } = useMarketFilters();
  const options = useMarketOptions();
  const items = useMarketItems(filters);

  const page = items.data;
  const pages = page ? totalPages(page) : 1;
  // 이전 조건의 결과를 보여주는 중이면(새 페이지 로딩 중) 흐리게 해서 아직 최신이 아님을 알립니다.
  const stale = items.isPlaceholderData;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 font-display text-3xl tracking-wide text-gray-50 sm:text-4xl">
        거래소
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        카테고리와 이름으로 거래소 아이템을 찾고 현재 최저가를 확인해요.
      </p>

      <MarketSearchForm
        filters={filters}
        options={options.data}
        optionsError={options.isError}
        onChange={setFilters}
      />

      {items.isError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {toErrorMessage(items.error)}
          <button
            type="button"
            onClick={() => void items.refetch()}
            className="shrink-0 underline underline-offset-2"
          >
            다시 시도
          </button>
        </div>
      )}

      {items.isPending && <TableSkeleton />}

      {page && page.TotalCount === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          조건에 맞는 아이템이 없어요.
        </p>
      )}

      {page && page.TotalCount > 0 && page.Items.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          {filters.page}페이지에는 아이템이 없어요.{" "}
          <button
            type="button"
            onClick={() => setFilters({ page: 1 })}
            className="text-accent underline underline-offset-2"
          >
            첫 페이지로
          </button>
        </p>
      )}

      {page && page.Items.length > 0 && (
        <section aria-label="검색 결과" aria-busy={items.isFetching}>
          <div className="mb-2 flex items-baseline justify-between text-xs text-gray-500">
            <span>
              총 <span className="font-mono text-gray-300">{page.TotalCount}</span>개
            </span>
            <span>가격은 묶음 단위 골드 · 최대 5분 전 시세</span>
          </div>
          <div className={`transition-opacity ${stale ? "opacity-50" : ""}`}>
            <MarketItemTable
              items={page.Items}
              sort={filters.sort}
              order={filters.order}
              onSort={(sort) => setFilters(toggleSort(filters, sort))}
            />
          </div>
          <Pagination
            page={filters.page}
            totalPages={pages}
            hrefFor={(n) => `/market?${toMarketSearch({ ...filters, page: n })}`}
            onNavigate={(n) => setFilters({ page: n })}
            onPrefetch={items.prefetchPage}
          />
        </section>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div
      role="status"
      aria-label="시세 불러오는 중"
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
        >
          <span className="h-9 w-9 rounded-md bg-border motion-safe:animate-pulse" />
          <span className="h-3 flex-1 rounded bg-border motion-safe:animate-pulse" />
          <span className="h-3 w-16 rounded bg-border motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}
