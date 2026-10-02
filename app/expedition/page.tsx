"use client";

import { useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import RosterTable from "@/components/RosterTable";
import { useRoster } from "@/lib/useRoster";
import { groupRosterByServer, summarizeRoster } from "@/lib/roster";

// 요약 카드에서 "주력 캐릭터"로 세는 아이템레벨 기준
const MAIN_THRESHOLD = 1640;

export default function ExpeditionPage() {
  const { roster, searchedName, loading, error, search } = useRoster();

  const groups = useMemo(() => (roster ? groupRosterByServer(roster) : []), [roster]);
  const summary = useMemo(
    () => (roster ? summarizeRoster(roster, MAIN_THRESHOLD) : null),
    [roster],
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 font-display text-3xl tracking-wide text-gray-50 sm:text-4xl">
        원정대
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        캐릭터 하나만 검색하면 같은 원정대의 모든 캐릭터를 서버별로 보여드려요.
      </p>

      <SearchBar onSearch={search} loading={loading} />

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {roster && summary && (
        <div key={searchedName} className="motion-safe:animate-fade-in">
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryItem label="캐릭터" value={`${summary.total}`} />
            <SummaryItem label="최고 레벨" value={summary.highestItemLevel.toFixed(2)} />
            <SummaryItem label="평균 레벨" value={summary.averageItemLevel.toFixed(2)} />
            <SummaryItem
              label={`${MAIN_THRESHOLD} 이상`}
              value={`${summary.countAtOrAbove}`}
            />
          </dl>
          <RosterTable groups={groups} highlightName={searchedName} />
        </div>
      )}

      {!roster && !loading && !error && (
        <p className="text-center text-sm text-gray-500">
          캐릭터를 검색하면 원정대 목록이 표시됩니다.
        </p>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </dt>
      <dd className="font-mono text-lg font-bold text-gray-100">{value}</dd>
    </div>
  );
}
