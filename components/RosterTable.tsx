import type { ServerGroup } from "@/lib/roster";
import type { ProfileState } from "@/lib/useRosterProfiles";

interface RosterTableProps {
  groups: ServerGroup[];
  highlightName: string | null;
  // 캐릭터별 프로필 조회 상태. 없으면 전투력 칸 없이 기존처럼 그립니다.
  profiles?: ReadonlyMap<string, ProfileState>;
}

export default function RosterTable({
  groups,
  highlightName,
  profiles,
}: RosterTableProps) {
  // 전투력 열이 생기면 모바일(390px) 폭에서 숫자 두 열이 넘치므로, 좁은 화면에서만 여백과 글자를 줄입니다.
  const cell = profiles ? "px-2 py-3 sm:px-4" : "px-4 py-3";
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, groupIndex) => (
        <section
          key={group.serverName}
          aria-labelledby={`server-${groupIndex}`}
          className="overflow-hidden rounded-xl border border-border bg-surface motion-safe:animate-fade-slide-up"
          style={{ animationDelay: `${groupIndex * 60}ms` }}
        >
          <h2
            id={`server-${groupIndex}`}
            className="flex items-center justify-between border-b border-border px-4 py-3 text-sm font-bold"
          >
            {group.serverName}
            <span className="text-xs font-normal text-gray-500">
              {group.characters.length}캐릭터
            </span>
          </h2>
          <table
            className={`w-full table-fixed ${profiles ? "text-xs sm:text-sm" : "text-sm"}`}
          >
            {/* 서버마다 표가 따로라서 열 너비를 고정해야 세로 줄이 맞습니다 */}
            <colgroup>
              <col className={profiles ? "w-[32%]" : "w-[45%]"} />
              <col className={profiles ? "w-[22%]" : "w-[30%]"} />
              <col className={profiles ? "w-[23%]" : "w-[25%]"} />
              {profiles && <col className="w-[23%]" />}
            </colgroup>
            <thead className="sr-only">
              <tr>
                <th scope="col">캐릭터명</th>
                <th scope="col">직업</th>
                <th scope="col">아이템레벨</th>
                {profiles && <th scope="col">전투력</th>}
              </tr>
            </thead>
            <tbody>
              {group.characters.map((character) => {
                const isSearched = character.CharacterName === highlightName;
                return (
                  <tr
                    key={character.CharacterName}
                    aria-current={isSearched ? "true" : undefined}
                    className={`border-b border-border/60 last:border-b-0 ${
                      isSearched ? "bg-accent/10" : ""
                    }`}
                  >
                    <td className={`truncate ${cell}`}>
                      <span className={isSearched ? "font-bold text-accent" : ""}>
                        {character.CharacterName}
                      </span>
                    </td>
                    <td className={`truncate ${cell} text-gray-400`}>
                      {character.CharacterClassName}
                    </td>
                    <td className={`${cell} text-right font-mono text-gray-200`}>
                      {character.ItemAvgLevel}
                    </td>
                    {profiles && (
                      <td className={`${cell} text-right font-mono text-gold`}>
                        <CombatPowerCell state={profiles.get(character.CharacterName)} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

// 응답이 오기 전에는 자리만 잡아 둬서, 값이 채워질 때 행 높이나 열 너비가 흔들리지 않게 합니다.
function CombatPowerCell({ state }: { state: ProfileState | undefined }) {
  if (!state || state.status === "pending") {
    return (
      <>
        <span
          aria-hidden="true"
          className="inline-block h-3 w-10 rounded bg-gray-700/60 motion-safe:animate-pulse sm:w-14"
        />
        <span className="sr-only">불러오는 중</span>
      </>
    );
  }
  if (state.status === "error") {
    return (
      <span className="text-gray-600" title={state.message}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">불러오지 못함: {state.message}</span>
      </span>
    );
  }
  return state.profile.CombatPower ?? <span className="text-gray-600">—</span>;
}
