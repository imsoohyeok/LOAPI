import type { Gems } from "@/lib/types";
import { getGradeStyle } from "@/lib/grades";
import { averageGemLevel, buildGemViews, GEM_KIND_LABEL, type GemKind } from "@/lib/gems";

const KIND_BADGE: Record<GemKind, string> = {
  damage: "bg-red-500/15 text-red-300",
  cooldown: "bg-sky-500/15 text-sky-300",
  other: "bg-gray-500/15 text-gray-300",
};

export default function GemList({ gems }: { gems: Gems }) {
  const views = buildGemViews(gems);
  if (views.length === 0) return null;

  const avg = averageGemLevel(views);

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">보석</h3>
        <span className="text-xs text-gray-500">
          {views.length}개{avg !== null && ` · 평균 Lv.${avg.toFixed(1)}`}
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
        {views.map((gem) => {
          const style = getGradeStyle(gem.grade);
          return (
            <li
              key={gem.key}
              className="flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm"
              style={{ borderLeftColor: style.border, backgroundColor: style.bg }}
            >
              {gem.icon && (
                // 작은 CDN 아이콘이라 next/image 최적화 없이 그대로 씁니다.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gem.icon}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded"
                />
              )}
              <div className="min-w-0">
                <div className="mb-0.5 flex items-center gap-1.5">
                  {gem.level !== null && (
                    <span className="font-mono font-bold" style={{ color: style.color }}>
                      Lv.{gem.level}
                    </span>
                  )}
                  <span
                    className={`rounded px-1.5 py-px text-[11px] font-semibold ${KIND_BADGE[gem.kind]}`}
                  >
                    {GEM_KIND_LABEL[gem.kind]}
                  </span>
                </div>
                <p className="truncate text-gray-300" title={gem.skillName ?? gem.name}>
                  {gem.skillName ?? gem.name}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
