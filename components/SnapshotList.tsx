import type { Snapshot } from "@/lib/storage";

interface SnapshotListProps {
  snapshots: Snapshot[];
  onDelete: (date: string) => void;
}

export default function SnapshotList({ snapshots, onDelete }: SnapshotListProps) {
  if (snapshots.length === 0) return null;

  const sorted = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="divide-y divide-border text-sm">
      {sorted.map((s) => (
        <li key={s.date} className="flex items-center justify-between py-2">
          <span className="text-gray-400">{s.date}</span>
          <span className="font-medium">{s.itemLevel}</span>
          <button
            onClick={() => onDelete(s.date)}
            className="text-xs text-gray-500 hover:text-red-400"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}
