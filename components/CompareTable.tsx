import type { CharacterData } from "@/lib/types";
import { parseItemLevel } from "@/lib/utils";

interface CompareTableProps {
  left: CharacterData;
  right: CharacterData;
}

export default function CompareTable({ left, right }: CompareTableProps) {
  const leftLevel = parseItemLevel(left.profile.ItemAvgLevel);
  const rightLevel = parseItemLevel(right.profile.ItemAvgLevel);

  const maxEquipLength = Math.max(left.equipment.length, right.equipment.length);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-gray-400">
            <th className="w-24 px-4 py-3 font-medium">항목</th>
            <th className="px-4 py-3 font-medium">{left.profile.CharacterName}</th>
            <th className="px-4 py-3 font-medium">{right.profile.CharacterName}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/60">
            <td className="px-4 py-3 text-gray-400">아이템레벨</td>
            <Highlighted
              value={left.profile.ItemAvgLevel}
              isWinner={leftLevel > rightLevel}
            />
            <Highlighted
              value={right.profile.ItemAvgLevel}
              isWinner={rightLevel > leftLevel}
            />
          </tr>
          <tr className="border-b border-border/60">
            <td className="px-4 py-3 text-gray-400">서버</td>
            <td className="px-4 py-3">{left.profile.ServerName}</td>
            <td className="px-4 py-3">{right.profile.ServerName}</td>
          </tr>
          <tr className="border-b border-border/60">
            <td className="px-4 py-3 text-gray-400">직업</td>
            <td className="px-4 py-3">{left.profile.CharacterClassName}</td>
            <td className="px-4 py-3">{right.profile.CharacterClassName}</td>
          </tr>

          {Array.from({ length: maxEquipLength }).map((_, idx) => {
            const l = left.equipment[idx];
            const r = right.equipment[idx];
            return (
              <tr key={idx} className="border-b border-border/60 text-xs">
                <td className="px-4 py-2 text-gray-500">
                  {l?.Type ?? r?.Type ?? "장비"}
                </td>
                <td className="px-4 py-2">{l?.Name ?? "-"}</td>
                <td className="px-4 py-2">{r?.Name ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Highlighted({ value, isWinner }: { value: string; isWinner: boolean }) {
  return (
    <td className={`px-4 py-3 ${isWinner ? "font-bold text-gold" : ""}`}>
      {value}
      {isWinner && " ▲"}
    </td>
  );
}
