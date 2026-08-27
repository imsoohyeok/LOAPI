import type { Engravings } from "@/lib/types";

export default function EngravingList({ engravings }: { engravings: Engravings }) {
  const list = engravings.Engravings;
  if (!list || list.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-3 font-semibold">각인</h3>
      <ul className="space-y-1 text-sm text-gray-300">
        {list.map((eng, idx) => (
          <li key={idx}>
            {eng.Name} {eng.Level ? `Lv.${eng.Level}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
