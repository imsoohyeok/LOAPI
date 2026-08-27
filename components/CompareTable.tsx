import type { CharacterData, EquipmentItem } from "@/lib/types";
import { parseItemLevel, filterDisplayEquipment } from "@/lib/utils";
import { getGradeStyle } from "@/lib/grades";

interface CompareTableProps {
  left: CharacterData;
  right: CharacterData;
}

export default function CompareTable({ left, right }: CompareTableProps) {
  const leftLevel = parseItemLevel(left.profile.ItemAvgLevel);
  const rightLevel = parseItemLevel(right.profile.ItemAvgLevel);

  const leftEquipment = filterDisplayEquipment(left.equipment);
  const rightEquipment = filterDisplayEquipment(right.equipment);
  const maxEquipLength = Math.max(leftEquipment.length, rightEquipment.length);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-gray-400">
            <th className="w-24 px-4 py-3 text-xs font-bold uppercase tracking-widest">
              항목
            </th>
            <th className="px-4 py-3 text-lg font-bold tracking-tight text-gray-100">
              {left.profile.CharacterName}
            </th>
            <th className="px-4 py-3 text-lg font-bold tracking-tight text-gray-100">
              {right.profile.CharacterName}
            </th>
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
            const l = leftEquipment[idx];
            const r = rightEquipment[idx];
            return (
              <tr key={idx} className="border-b border-border/60 text-xs">
                <td className="px-4 py-2 text-gray-500">
                  {l?.Type ?? r?.Type ?? "장비"}
                </td>
                <GradedCell item={l} />
                <GradedCell item={r} />
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
    <td
      className={`px-4 py-3 font-mono text-base ${
        isWinner ? "font-bold text-gold" : "text-gray-200"
      }`}
    >
      {value}
      {isWinner && " ▲"}
    </td>
  );
}

function GradedCell({ item }: { item: EquipmentItem | undefined }) {
  if (!item) return <td className="px-4 py-2 text-gray-600">-</td>;
  const style = getGradeStyle(item.Grade);
  return (
    <td className="px-4 py-2" style={{ color: style.color }}>
      {item.Name}
    </td>
  );
}
