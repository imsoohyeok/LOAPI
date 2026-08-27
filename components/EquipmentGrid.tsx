import type { Equipment } from "@/lib/types";
import { getGradeStyle } from "@/lib/grades";
import { filterDisplayEquipment } from "@/lib/utils";

export default function EquipmentGrid({ equipment }: { equipment: Equipment }) {
  const filtered = filterDisplayEquipment(equipment);
  if (filtered.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-3 font-semibold">장비</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
        {filtered.map((item, idx) => {
          const style = getGradeStyle(item.Grade);
          return (
            <div
              key={idx}
              className="rounded-lg border-l-4 bg-bg/60 px-3 py-2.5 text-sm"
              style={{ borderLeftColor: style.border, backgroundColor: style.bg }}
            >
              <span className="mb-1 block text-gray-500">{item.Type}</span>
              <span style={{ color: style.color }}>{item.Name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
