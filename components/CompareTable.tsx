import type { CharacterData, EquipmentItem } from "@/lib/types";
import { parseItemLevel, filterDisplayEquipment } from "@/lib/utils";
import { getGradeStyle } from "@/lib/grades";

interface CompareTableProps {
  left: CharacterData;
  right: CharacterData;
}

// 행마다 조금씩 지연시켜 순차적으로 나타나는 효과를 줍니다. (너무 오래 걸리지 않게 상한을 둡니다)
function rowDelay(index: number): number {
  return Math.min(index * 45, 400);
}

export default function CompareTable({ left, right }: CompareTableProps) {
  const leftItemLevel = parseItemLevel(left.profile.ItemAvgLevel);
  const rightItemLevel = parseItemLevel(right.profile.ItemAvgLevel);

  const leftCombatPower = left.profile.CombatPower
    ? parseItemLevel(left.profile.CombatPower)
    : null;
  const rightCombatPower = right.profile.CombatPower
    ? parseItemLevel(right.profile.CombatPower)
    : null;
  const hasCombatPower = leftCombatPower !== null && rightCombatPower !== null;

  const leftEquipment = filterDisplayEquipment(left.equipment);
  const rightEquipment = filterDisplayEquipment(right.equipment);
  const maxEquipLength = Math.max(leftEquipment.length, rightEquipment.length);

  let rowIndex = 0;

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
          {hasCombatPower && (
            <Row delay={rowDelay(rowIndex++)}>
              <td className="px-4 py-3 font-bold text-gray-300">전투력</td>
              <Highlighted
                value={left.profile.CombatPower!}
                isWinner={leftCombatPower! > rightCombatPower!}
                emphasize
              />
              <Highlighted
                value={right.profile.CombatPower!}
                isWinner={rightCombatPower! > leftCombatPower!}
                emphasize
              />
            </Row>
          )}
          <Row delay={rowDelay(rowIndex++)}>
            <td className="px-4 py-3 text-gray-400">아이템레벨</td>
            <Highlighted
              value={left.profile.ItemAvgLevel}
              isWinner={leftItemLevel > rightItemLevel}
            />
            <Highlighted
              value={right.profile.ItemAvgLevel}
              isWinner={rightItemLevel > leftItemLevel}
            />
          </Row>
          <Row delay={rowDelay(rowIndex++)}>
            <td className="px-4 py-3 text-gray-400">서버</td>
            <td className="px-4 py-3">{left.profile.ServerName}</td>
            <td className="px-4 py-3">{right.profile.ServerName}</td>
          </Row>
          <Row delay={rowDelay(rowIndex++)}>
            <td className="px-4 py-3 text-gray-400">직업</td>
            <td className="px-4 py-3">{left.profile.CharacterClassName}</td>
            <td className="px-4 py-3">{right.profile.CharacterClassName}</td>
          </Row>

          {Array.from({ length: maxEquipLength }).map((_, idx) => {
            const l = leftEquipment[idx];
            const r = rightEquipment[idx];
            return (
              <Row key={idx} delay={rowDelay(rowIndex + idx)} className="text-xs">
                <td className="px-4 py-2 text-gray-500">
                  {l?.Type ?? r?.Type ?? "장비"}
                </td>
                <GradedCell item={l} />
                <GradedCell item={r} />
              </Row>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-border/60 motion-safe:animate-fade-slide-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </tr>
  );
}

function Highlighted({
  value,
  isWinner,
  emphasize = false,
}: {
  value: string;
  isWinner: boolean;
  emphasize?: boolean;
}) {
  return (
    <td className="px-4 py-3">
      <span
        className={`relative inline-block font-mono ${emphasize ? "text-lg" : "text-base"} ${
          isWinner
            ? "rounded px-1.5 py-0.5 font-bold text-gold motion-safe:animate-glow-settle"
            : "text-gray-200"
        }`}
      >
        {value}
        {isWinner && <span className="ml-1">▲</span>}
        {isWinner && (
          <span className="absolute -bottom-0.5 left-1.5 right-1.5 h-px origin-left scale-x-0 rounded-full bg-gold/70 motion-safe:animate-underline-draw" />
        )}
      </span>
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
