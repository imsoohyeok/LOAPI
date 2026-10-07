"use client";

import { useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import RosterTable from "@/components/RosterTable";
import CacheBadge from "@/components/CacheBadge";
import { useRoster } from "@/lib/useRoster";
import { useRosterProfiles, type RosterProfiles } from "@/lib/useRosterProfiles";
import { groupRosterByServer, summarizeRoster } from "@/lib/roster";

// 요약 카드에서 "주력 캐릭터"로 세는 아이템레벨 기준
const MAIN_THRESHOLD = 1640;

// API의 ItemAvgLevel 표기("1,680.00")와 같은 형태로 맞춥니다.
const levelFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ExpeditionPage() {
  const { roster, cacheInfo, searchedName, loading, error, search } = useRoster();
  const profiles = useRosterProfiles(roster);

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
          <div className="mb-2 flex items-center justify-between gap-3">
            <ProfileProgress {...profiles} />
            <CacheBadge info={cacheInfo} />
          </div>
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryItem label="캐릭터" value={`${summary.total}`} />
            <SummaryItem
              label="최고 레벨"
              value={levelFormatter.format(summary.highestItemLevel)}
            />
            <SummaryItem
              label="평균 레벨"
              value={levelFormatter.format(summary.averageItemLevel)}
            />
            <SummaryItem
              label={`${MAIN_THRESHOLD} 이상`}
              value={`${summary.countAtOrAbove}`}
            />
          </dl>
          <RosterTable
            groups={groups}
            highlightName={searchedName}
            profiles={profiles.byName}
          />
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

// 전투력은 캐릭터마다 따로 받아서 도착하는 대로 표에 채웁니다. 진행 상황은 스크린 리더에도
// 알리되(aria-live), 숫자가 바뀔 때마다 읽지 않도록 polite로 둡니다.
function ProfileProgress({
  total,
  loaded,
  failed,
  retryFailed,
}: Omit<RosterProfiles, "byName">) {
  const pending = total - loaded - failed;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500" aria-live="polite">
      {pending > 0 ? (
        <span>
          전투력 불러오는 중 {loaded + failed}/{total}
        </span>
      ) : failed > 0 ? (
        <>
          <span>전투력 {failed}개를 불러오지 못했어요.</span>
          <button
            type="button"
            onClick={retryFailed}
            className="rounded border border-border px-2 py-0.5 text-gray-300 hover:border-accent hover:text-accent"
          >
            다시 시도
          </button>
        </>
      ) : null}
    </div>
  );
}
