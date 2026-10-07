"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import CacheBadge from "@/components/CacheBadge";
import CharacterCard from "@/components/CharacterCard";
import EngravingList from "@/components/EngravingList";
import EquipmentGrid from "@/components/EquipmentGrid";
import GemList from "@/components/GemList";
import GrowthChart from "@/components/GrowthChart";
import SnapshotList from "@/components/SnapshotList";
import TrackerBackup from "@/components/TrackerBackup";
import TrackerCharacterSwitcher from "@/components/TrackerCharacterSwitcher";
import { useCharacterQuery } from "@/lib/useCharacterSearch";
import { useTrackerName } from "@/lib/useTrackerName";
import { useSnapshots, useTrackedSummaries } from "@/lib/useTrackerStorage";
import { addSnapshot, deleteSnapshot } from "@/lib/storage";
import { parseItemLevel } from "@/lib/utils";

export default function TrackerView() {
  const { name, setName } = useTrackerName();
  const { data, loading, error, search } = useCharacterQuery(name, setName);
  // 기록은 API가 돌려준 정식 캐릭터명으로 저장합니다(입력한 철자와 다를 수 있음).
  const characterName = data?.profile.CharacterName ?? null;
  const snapshots = useSnapshots(characterName);
  const summaries = useTrackedSummaries();
  // "저장되었어요" 안내는 저장한 캐릭터에서만 보여야 합니다. 불리언 대신 캐릭터명을 들고 있으면
  // 다른 캐릭터로 전환할 때 effect로 초기화하지 않아도 저절로 사라집니다.
  const [savedFor, setSavedFor] = useState<string | null>(null);

  function handleSaveSnapshot() {
    if (!data) return;
    addSnapshot(data.profile.CharacterName, parseItemLevel(data.profile.ItemAvgLevel));
    setSavedFor(data.profile.CharacterName);
  }

  function handleDelete(date: string) {
    if (!characterName) return;
    deleteSnapshot(characterName, date);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 text-2xl font-bold">내 캐릭터 성장 트래커</h1>
      <p className="mb-6 text-sm text-gray-400">
        캐릭터를 검색하고 스냅샷을 저장하면 아이템레벨 성장 추이를 볼 수 있어요. 기록은 이
        브라우저에만 저장돼요 (서버에 전송되지 않음).
      </p>

      <TrackerBackup hasRecords={(summaries?.length ?? 0) > 0} />

      <TrackerCharacterSwitcher summaries={summaries} current={characterName ?? name} />

      <SearchBar onSearch={search} loading={loading} initialValue={name ?? ""} />

      {error && (
        <div className="mb-5 rounded-lg bg-red-950 px-4 py-3 text-red-300">{error}</div>
      )}

      {data && (
        <div key={data.profile.CharacterName}>
          <div className="motion-safe:animate-fade-slide-up">
            <div className="mb-2 flex justify-end">
              <CacheBadge info={data.cacheInfo} />
            </div>
            <CharacterCard profile={data.profile} />
          </div>

          <div className="motion-safe:animate-fade-slide-up motion-safe:delay-100">
            <EngravingList engravings={data.engravings} />
            <EquipmentGrid equipment={data.equipment} />
            <GemList gems={data.gems} />
          </div>

          <div className="mb-5 rounded-xl border border-border bg-surface p-6 motion-safe:animate-fade-slide-up motion-safe:delay-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">성장 추이</h3>
              <button
                onClick={handleSaveSnapshot}
                className="rounded-lg border border-accent px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
              >
                오늘 기록 저장
              </button>
            </div>

            {savedFor === characterName && (
              <p className="mb-3 text-xs text-green-400">오늘 기록이 저장되었어요.</p>
            )}

            <GrowthChart snapshots={snapshots} />
          </div>

          {snapshots.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 motion-safe:animate-fade-slide-up motion-safe:delay-200">
              <h3 className="mb-3 font-semibold">저장된 기록</h3>
              <SnapshotList snapshots={snapshots} onDelete={handleDelete} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
