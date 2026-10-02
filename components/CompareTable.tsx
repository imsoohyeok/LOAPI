import type { CharacterData, Engraving, EquipmentItem } from "@/lib/types";
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

  const leftEngravings = left.engravings.Engravings;
  const rightEngravings = right.engravings.Engravings;
  const hasEngravings = leftEngravings.length > 0 || rightEngravings.length > 0;
  // 두 캐릭터가 같이 쓰는 각인은 밑줄로 표시해서 차이점이 눈에 들어오게 합니다.
  const rightNames = new Set(rightEngravings.map((e) => e.Name));
  const sharedEngravings = new Set(
    leftEngravings.filter((e) => rightNames.has(e.Name)).map((e) => e.Name),
  );

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
          {hasEngravings && (
            <Row delay={rowDelay(rowIndex++)}>
              <td className="px-4 py-3 align-top text-gray-400">각인</td>
              <EngravingCell list={leftEngravings} shared={sharedEngravings} />
              <EngravingCell list={rightEngravings} shared={sharedEngravings} />
            </Row>
          )}

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

function EngravingCell({ list, shared }: { list: Engraving[]; shared: Set<string> }) {
  if (list.length === 0) return <td className="px-4 py-3 align-top text-gray-600">-</td>;
  return (
    <td className="px-4 py-3 align-top">
      <ul className="space-y-0.5 text-xs">
        {list.map((eng) => (
          <li
            key={eng.Name}
            className={
              shared.has(eng.Name)
                ? "underline decoration-gray-600 underline-offset-2"
                : ""
            }
            style={{ color: eng.Grade ? getGradeStyle(eng.Grade).color : undefined }}
          >
            {eng.Name}
            {eng.Level != null && (
              <span className="ml-1 font-mono text-gray-400">{eng.Level}</span>
            )}
          </li>
        ))}
      </ul>
    </td>
  );
}
