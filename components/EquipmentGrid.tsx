import type { Equipment } from "@/lib/types";

export default function EquipmentGrid({ equipment }: { equipment: Equipment }) {
  if (equipment.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-3 font-semibold">장비</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
        {equipment.map((item, idx) => (
          <div key={idx} className="rounded-lg bg-bg/60 px-3 py-2.5 text-sm">
            <span className="mb-1 block text-gray-500">{item.Type}</span>
            {item.Name}
          </div>
        ))}
      </div>
    </div>
  );
}
