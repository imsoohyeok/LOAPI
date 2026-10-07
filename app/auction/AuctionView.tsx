"use client";

import Link from "next/link";
import AuctionSearchForm from "@/components/AuctionSearchForm";
import AuctionItemList from "@/components/AuctionItemList";
import Pagination from "@/components/Pagination";
import { toErrorMessage } from "@/lib/api";
import { AUCTION_SORTS, type AuctionSort } from "@/lib/auction";
import { totalPages } from "@/lib/market";
import { toAuctionSearch } from "@/lib/auctionParams";
import { useAuctionFilters, useAuctionItems, useAuctionOptions } from "@/lib/useAuction";
import { useNow } from "@/lib/useNow";

export default function AuctionView() {
  const { filters, setFilters } = useAuctionFilters();
  const options = useAuctionOptions();
  const items = useAuctionItems(filters);
  // 남은 시간("12분 남음")이 화면에 머무는 동안 낡지 않게 주기적으로 다시 그립니다.
  const now = useNow();

  const page = items.data;
  const pages = page ? totalPages(page) : 1;
  const stale = items.isPlaceholderData;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 font-display text-3xl tracking-wide text-gray-50 sm:text-4xl">
        경매장
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        보석·장신구처럼 매물마다 옵션이 다른 아이템을 조건으로 찾아요. 재료·각인서 시세는{" "}
        <Link href="/market" className="text-accent underline underline-offset-2">
          거래소
        </Link>
        에서 볼 수 있어요.
      </p>

      <AuctionSearchForm
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

      {items.isPending && <ListSkeleton />}

      {page && page.TotalCount === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          조건에 맞는 매물이 없어요.
          {filters.options.length > 0 && " 옵션 조건을 줄여 보세요."}
        </p>
      )}

      {page && page.TotalCount > 0 && page.Items.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          {filters.page}페이지에는 매물이 없어요.{" "}
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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              총 <span className="font-mono text-gray-300">{page.TotalCount}</span>개 ·
              최대 5분 전 매물
            </span>
            <SortControl
              sort={filters.sort}
              order={filters.order}
              onChange={(patch) => setFilters(patch)}
            />
          </div>
          <div className={`transition-opacity ${stale ? "opacity-50" : ""}`}>
            <AuctionItemList items={page.Items} now={now} />
          </div>
          <Pagination
            page={filters.page}
            totalPages={pages}
            hrefFor={(n) => `/auction?${toAuctionSearch({ ...filters, page: n })}`}
            onNavigate={(n) => setFilters({ page: n })}
            onPrefetch={items.prefetchPage}
          />
        </section>
      )}
    </div>
  );
}

// 경매장 결과는 카드 목록이라 거래소처럼 표 머리글을 누를 곳이 없어서, 정렬 기준과 방향을 따로 고릅니다.
function SortControl({
  sort,
  order,
  onChange,
}: {
  sort: AuctionSort;
  order: "ASC" | "DESC";
  onChange: (patch: { sort?: AuctionSort; order?: "ASC" | "DESC" }) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <label htmlFor="auction-sort" className="sr-only">
        정렬 기준
      </label>
      <select
        id="auction-sort"
        value={sort}
        onChange={(e) => onChange({ sort: e.target.value as AuctionSort })}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {AUCTION_SORTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange({ order: order === "ASC" ? "DESC" : "ASC" })}
        aria-label={
          order === "ASC"
            ? "오름차순 정렬 중, 눌러서 내림차순으로"
            : "내림차순 정렬 중, 눌러서 오름차순으로"
        }
        className="rounded-md border border-border px-2 py-1 text-gray-300 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {order === "ASC" ? "낮은 순 ▲" : "높은 순 ▼"}
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div
      role="status"
      aria-label="매물 불러오는 중"
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border/60 px-4 py-4 last:border-b-0"
        >
          <span className="h-10 w-10 rounded-md bg-border motion-safe:animate-pulse" />
          <span className="h-3 flex-1 rounded bg-border motion-safe:animate-pulse" />
          <span className="h-3 w-20 rounded bg-border motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}
