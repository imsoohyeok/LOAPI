import type { Roster, Sibling } from "@/lib/types";
import { parseItemLevel } from "@/lib/utils";

export interface RosterCharacter extends Sibling {
  itemLevel: number;
}

export interface ServerGroup {
  serverName: string;
  characters: RosterCharacter[];
  maxItemLevel: number;
}

export interface RosterSummary {
  total: number;
  averageItemLevel: number;
  highestItemLevel: number;
  countAtOrAbove: number;
}

// 서버별로 묶고, 서버 안에서는 아이템레벨 내림차순,
// 서버끼리는 해당 서버 최고 아이템레벨 내림차순으로 정렬합니다.
export function groupRosterByServer(roster: Roster): ServerGroup[] {
  const groups = new Map<string, RosterCharacter[]>();

  for (const sibling of roster) {
    const character = { ...sibling, itemLevel: parseItemLevel(sibling.ItemAvgLevel) };
    const list = groups.get(sibling.ServerName);
    if (list) list.push(character);
    else groups.set(sibling.ServerName, [character]);
  }

  return Array.from(groups, ([serverName, characters]) => {
    characters.sort((a, b) => b.itemLevel - a.itemLevel);
    return { serverName, characters, maxItemLevel: characters[0]?.itemLevel ?? 0 };
  }).sort((a, b) => b.maxItemLevel - a.maxItemLevel);
}

export function summarizeRoster(roster: Roster, threshold: number): RosterSummary {
  const levels = roster.map((s) => parseItemLevel(s.ItemAvgLevel));
  const total = levels.length;
  const sum = levels.reduce((acc, level) => acc + level, 0);

  return {
    total,
    averageItemLevel: total === 0 ? 0 : sum / total,
    highestItemLevel: total === 0 ? 0 : Math.max(...levels),
    countAtOrAbove: levels.filter((level) => level >= threshold).length,
  };
}
