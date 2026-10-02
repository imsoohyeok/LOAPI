import type { Engraving, Engravings } from "@/lib/types";
import { getGradeStyle } from "@/lib/grades";

export default function EngravingList({ engravings }: { engravings: Engravings }) {
  const list = engravings.Engravings;
  if (!list || list.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-3 font-semibold">각인</h3>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 text-sm">
        {list.map((eng) => (
          <EngravingItem key={eng.Name} engraving={eng} />
        ))}
      </ul>
    </div>
  );
}

function EngravingItem({ engraving }: { engraving: Engraving }) {
  const style = getGradeStyle(engraving.Grade);
  return (
    <li
      className="flex items-center justify-between rounded-lg border-l-4 px-3 py-2"
      style={{ borderLeftColor: style.border, backgroundColor: style.bg }}
    >
      <span style={{ color: engraving.Grade ? style.color : undefined }}>
        {engraving.Name}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-xs">
        {engraving.AbilityStoneLevel ? (
          <span
            className="rounded bg-bg/80 px-1 text-gray-400"
            title={`어빌리티 스톤 Lv.${engraving.AbilityStoneLevel}`}
          >
            돌 {engraving.AbilityStoneLevel}
          </span>
        ) : null}
        {engraving.Level != null && (
          <span className="text-gray-200">Lv.{engraving.Level}</span>
        )}
      </span>
    </li>
  );
}
