"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Snapshot } from "@/lib/storage";

export default function GrowthChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        아직 저장된 스냅샷이 없어요. &quot;오늘 기록 저장&quot; 버튼을 눌러보세요.
      </p>
    );
  }

  const levels = snapshots.map((s) => s.itemLevel);
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  const padding = Math.max((max - min) * 0.2, 1);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={snapshots} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
          <XAxis dataKey="date" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} domain={[min - padding, max + padding]} />
          <Tooltip
            contentStyle={{ background: "#1a1d24", border: "1px solid #2a2d35" }}
          />
          <Line
            type="monotone"
            dataKey="itemLevel"
            stroke="#4f7cff"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
