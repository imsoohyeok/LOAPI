"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import CharacterCard from "@/components/CharacterCard";
import GrowthChart from "@/components/GrowthChart";
import SnapshotList from "@/components/SnapshotList";
import { useCharacterSearch } from "@/lib/useCharacterSearch";
import { addSnapshot, deleteSnapshot, getSnapshots, type Snapshot } from "@/lib/storage";
import { parseItemLevel } from "@/lib/utils";

export default function TrackerPage() {
  const { data, loading, error, search } = useCharacterSearch();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setSnapshots(getSnapshots(data.profile.CharacterName));
      setSaved(false);
    }
  }, [data]);

  function handleSaveSnapshot() {
    if (!data) return;
    const level = parseItemLevel(data.profile.ItemAvgLevel);
    const updated = addSnapshot(data.profile.CharacterName, level);
    setSnapshots(updated);
    setSaved(true);
  }

  function handleDelete(date: string) {
    if (!data) return;
    setSnapshots(deleteSnapshot(data.profile.CharacterName, date));
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-2xl font-bold">내 캐릭터 성장 트래커</h1>
      <p className="mb-6 text-sm text-gray-400">
        캐릭터를 검색하고 스냅샷을 저장하면 아이템레벨 성장 추이를 볼 수 있어요. 기록은 이
        브라우저에만 저장돼요 (서버에 전송되지 않음).
      </p>

      <SearchBar onSearch={search} loading={loading} />

      {error && (
        <div className="mb-5 rounded-lg bg-red-950 px-4 py-3 text-red-300">{error}</div>
      )}

      {data && (
        <>
          <CharacterCard profile={data.profile} />

          <div className="mb-5 rounded-xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">성장 추이</h3>
              <button
                onClick={handleSaveSnapshot}
                className="rounded-lg border border-accent px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
              >
                오늘 기록 저장
              </button>
            </div>

            {saved && (
              <p className="mb-3 text-xs text-green-400">오늘 기록이 저장되었어요.</p>
            )}

            <GrowthChart snapshots={snapshots} />
          </div>

          {snapshots.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="mb-3 font-semibold">저장된 기록</h3>
              <SnapshotList snapshots={snapshots} onDelete={handleDelete} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
