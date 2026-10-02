import type { ServerGroup } from "@/lib/roster";

interface RosterTableProps {
  groups: ServerGroup[];
  highlightName: string | null;
}

export default function RosterTable({ groups, highlightName }: RosterTableProps) {
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
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">캐릭터명</th>
                <th scope="col">직업</th>
                <th scope="col">아이템레벨</th>
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
                    <td className="px-4 py-3">
                      <span className={isSearched ? "font-bold text-accent" : ""}>
                        {character.CharacterName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {character.CharacterClassName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-200">
                      {character.ItemAvgLevel}
                    </td>
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
