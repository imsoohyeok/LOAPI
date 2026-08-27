// 브라우저의 localStorage만 사용합니다. 서버/DB 없이 개인 기기에만 기록이 남습니다.

export interface Snapshot {
  date: string; // YYYY-MM-DD
  itemLevel: number;
}

const STORAGE_PREFIX = "lostark-tracker:";

function getKey(characterName: string): string {
  return `${STORAGE_PREFIX}${characterName}`;
}

export function getSnapshots(characterName: string): Snapshot[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(getKey(characterName));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Snapshot[];
    return parsed.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export function addSnapshot(characterName: string, itemLevel: number): Snapshot[] {
  const today = new Date().toISOString().slice(0, 10);
  const existing = getSnapshots(characterName).filter((s) => s.date !== today);
  const updated = [...existing, { date: today, itemLevel }].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  window.localStorage.setItem(getKey(characterName), JSON.stringify(updated));
  return updated;
}

export function deleteSnapshot(characterName: string, date: string): Snapshot[] {
  const updated = getSnapshots(characterName).filter((s) => s.date !== date);
  window.localStorage.setItem(getKey(characterName), JSON.stringify(updated));
  return updated;
}

export function getTrackedCharacterNames(): string[] {
  if (typeof window === "undefined") return [];
  const names: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      names.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return names;
}
