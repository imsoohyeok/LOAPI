"use client";

import SearchBar from "@/components/SearchBar";
import CompareTable from "@/components/CompareTable";
import GradeLegend from "@/components/GradeLegend";
import { useCharacterSearch } from "@/lib/useCharacterSearch";

export default function ComparePage() {
  const leftSearch = useCharacterSearch();
  const rightSearch = useCharacterSearch();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 font-display text-3xl tracking-wide text-gray-50 sm:text-4xl">
        캐릭터 비교
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        두 캐릭터를 검색하면 아이템레벨과 장비를 나란히 비교해드려요.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
            캐릭터 A
          </p>
          <SearchBar onSearch={leftSearch.search} loading={leftSearch.loading} />
          {leftSearch.error && (
            <div className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {leftSearch.error}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
            캐릭터 B
          </p>
          <SearchBar onSearch={rightSearch.search} loading={rightSearch.loading} />
          {rightSearch.error && (
            <div className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {rightSearch.error}
            </div>
          )}
        </div>
      </div>

      {leftSearch.data && rightSearch.data && (
        <div
          key={`${leftSearch.data.profile.CharacterName}-${rightSearch.data.profile.CharacterName}`}
          className="motion-safe:animate-fade-in"
        >
          <p className="mb-3 text-xs text-gray-600">
            ※ 전투력·아이템레벨은 로스트아크 API 캐시 특성상 실제 게임과 다를 수 있어요.
          </p>
          <GradeLegend />
          <CompareTable left={leftSearch.data} right={rightSearch.data} />
        </div>
      )}

      {(!leftSearch.data || !rightSearch.data) &&
        !leftSearch.loading &&
        !rightSearch.loading && (
          <p className="text-center text-sm text-gray-500">
            두 캐릭터를 모두 검색하면 비교 결과가 표시됩니다.
          </p>
        )}
    </div>
  );
}
