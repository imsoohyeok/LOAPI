"use client";

import SearchBar from "@/components/SearchBar";
import CompareTable from "@/components/CompareTable";
import GradeLegend from "@/components/GradeLegend";
import ShareButton from "@/components/ShareButton";
import { useCharacterQuery } from "@/lib/useCharacterSearch";
import { useCompareNames } from "@/lib/useCompareNames";

export default function CompareView() {
  const names = useCompareNames();
  // 검색하면 URL만 바꾸고, 화면은 URL에서 읽은 이름으로 조회합니다.
  // 그래서 직접 검색한 경우와 공유 링크로 들어온 경우가 같은 경로로 그려집니다.
  const left = useCharacterQuery(names.a, (next) => names.setName("a", next));
  const right = useCharacterQuery(names.b, (next) => names.setName("b", next));

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-2 font-display text-3xl tracking-wide text-gray-50 sm:text-4xl">
        캐릭터 비교
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        두 캐릭터를 검색하면 아이템레벨과 장비를 나란히 비교해드려요.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SideSearch label="캐릭터 A" name={names.a} query={left} />
        <SideSearch label="캐릭터 B" name={names.b} query={right} />
      </div>

      {left.data && right.data && (
        <div
          key={`${left.data.profile.CharacterName}-${right.data.profile.CharacterName}`}
          className="motion-safe:animate-fade-in"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              ※ 전투력·아이템레벨은 로스트아크 API 캐시 특성상 실제 게임과 다를 수 있어요.
            </p>
            <ShareButton />
          </div>
          <GradeLegend />
          <CompareTable left={left.data} right={right.data} />
        </div>
      )}

      {(!left.data || !right.data) && !left.loading && !right.loading && (
        <p className="text-center text-sm text-gray-500">
          두 캐릭터를 모두 검색하면 비교 결과가 표시됩니다.
        </p>
      )}
    </div>
  );
}

function SideSearch({
  label,
  name,
  query,
}: {
  label: string;
  name: string | null;
  query: ReturnType<typeof useCharacterQuery>;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <SearchBar
        onSearch={query.search}
        loading={query.loading}
        initialValue={name ?? ""}
      />
      {query.error && (
        <div className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
          {query.error}
        </div>
      )}
    </div>
  );
}
