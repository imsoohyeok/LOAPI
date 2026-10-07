"use client";

import Link from "next/link";
import { trackerHref } from "@/lib/trackerParams";
import { useTrackedSummaries } from "@/lib/useTrackerStorage";

const MAX_ITEMS = 5;

const levelFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function TrackedCharacters() {
  // 서버 렌더링에는 localStorage가 없으므로 첫 렌더는 null(자리 표시)이고, 하이드레이션 직후 실제 목록으로 바뀝니다.
  // 다른 탭의 트래커에서 기록을 남겨도 이 목록이 따라 바뀝니다.
  const summaries = useTrackedSummaries();

  if (summaries === null) {
    return (
      <div className="h-24 rounded-xl border border-border bg-surface" aria-hidden />
    );
  }

  if (summaries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-5 py-6 text-center text-sm text-gray-500">
        아직 기록한 캐릭터가 없어요.{" "}
        <Link href="/tracker" className="text-accent hover:underline">
          성장 트래커
        </Link>
        에서 첫 기록을 남겨보세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface motion-safe:animate-fade-in">
      {summaries.slice(0, MAX_ITEMS).map(({ name, latest, count }) => (
        <li key={name}>
          {/* 행 전체가 그 캐릭터의 트래커로 가는 링크입니다. */}
          <Link
            href={trackerHref(name)}
            className="group flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-100 group-hover:text-accent">
                {name}
              </p>
              <p className="text-xs text-gray-500">
                {latest.date} 기록 · 총 {count}회
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-gold">
              {levelFormatter.format(latest.itemLevel)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
