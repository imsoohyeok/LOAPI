"use client";

import { describeCacheStatus, type CacheInfo } from "@/lib/cacheStatus";
import { useNow } from "@/lib/useNow";

// 데이터가 서버 캐시에서 왔는지, 언제 받아온 데이터인지 보여주는 작은 배지입니다.
// 캐시 정보가 없는 응답이면 아무것도 그리지 않습니다.
export default function CacheBadge({ info }: { info: CacheInfo | null }) {
  const now = useNow();
  if (!info) return null;

  const status = describeCacheStatus(info, now);

  return (
    <span
      title={status.description}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-gray-400"
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${info.fromCache ? "bg-gold" : "bg-green-400"}`}
      />
      <span className="font-semibold text-gray-300">{status.label}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={new Date(info.fetchedAt).toISOString()}>{status.age}</time>
    </span>
  );
}
