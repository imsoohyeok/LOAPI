"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrackedSummaries, type TrackedSummary } from "@/lib/storage";

const MAX_ITEMS = 5;

const levelFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function TrackedCharacters() {
  // 서버 렌더링에는 localStorage가 없으므로 첫 렌더는 항상 null로 맞추고,
  // 마운트 후에 읽어서 하이드레이션 불일치를 피합니다.
  const [summaries, setSummaries] = useState<TrackedSummary[] | null>(null);

  useEffect(() => {
    setSummaries(getTrackedSummaries());
  }, []);

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
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface motion-safe:animate-fade-in">
      {summaries.slice(0, MAX_ITEMS).map(({ name, latest, count }) => (
        <li key={name} className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-100">{name}</p>
            <p className="text-xs text-gray-500">
              {latest.date} 기록 · 총 {count}회
            </p>
          </div>
          <span className="shrink-0 font-mono text-sm font-semibold text-gold">
            {levelFormatter.format(latest.itemLevel)}
          </span>
        </li>
      ))}
    </ul>
  );
}
