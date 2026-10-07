// 브라우저의 localStorage만 사용합니다. 서버/DB 없이 개인 기기에만 기록이 남습니다.

export interface Snapshot {
  date: string; // YYYY-MM-DD
  itemLevel: number;
}

const STORAGE_PREFIX = "lostark-tracker:";

function getKey(characterName: string): string {
  return `${STORAGE_PREFIX}${characterName}`;
}

// localStorage는 바뀌어도 React에 알려주지 않으므로, 이 모듈을 거친 쓰기는 직접 알립니다.
// 다른 탭에서 바뀐 기록은 브라우저가 보내는 storage 이벤트로 받습니다.
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeTracker(listener: () => void): () => void {
  function handleStorage(e: StorageEvent) {
    // key가 null이면 다른 탭에서 localStorage.clear()를 부른 경우입니다.
    if (e.key === null || e.key.startsWith(STORAGE_PREFIX)) listener();
  }
  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

// 저장된 원본 문자열입니다. useSyncExternalStore가 Object.is로 변경 여부를 비교하므로
// 매번 새 배열을 만드는 파싱 결과 대신 문자열 그대로를 스냅샷으로 씁니다.
export function getRawSnapshots(characterName: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getKey(characterName));
}

export function parseSnapshots(raw: string | null): Snapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Snapshot[];
    return parsed.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export function getSnapshots(characterName: string): Snapshot[] {
  return parseSnapshots(getRawSnapshots(characterName));
}

function saveSnapshots(characterName: string, snapshots: Snapshot[]) {
  // 마지막 기록을 지우면 키도 지워서, 빈 기록이 트래커 목록에 남지 않게 합니다.
  if (snapshots.length === 0) window.localStorage.removeItem(getKey(characterName));
  else window.localStorage.setItem(getKey(characterName), JSON.stringify(snapshots));
  notify();
}

// 백업 복원처럼 여러 캐릭터의 기록을 한꺼번에 씁니다.
// - 키마다 알리면 구독 중인 화면이 캐릭터 수만큼 다시 계산되므로, 다 쓴 뒤 한 번만 알립니다.
// - 도중에 용량 초과(QuotaExceededError) 등으로 실패하면 이미 쓴 키를 원래 값으로 되돌려서
//   "절반만 복원된" 상태를 남기지 않고, 오류는 호출한 쪽에 그대로 던집니다.
export function writeSnapshotsBulk(entries: Record<string, Snapshot[]>) {
  const previous: [string, string | null][] = [];
  try {
    for (const [name, snapshots] of Object.entries(entries)) {
      const key = getKey(name);
      previous.push([key, window.localStorage.getItem(key)]);
      if (snapshots.length === 0) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(snapshots));
    }
  } catch (error) {
    for (const [key, raw] of previous.reverse()) {
      if (raw === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, raw);
    }
    throw error;
  }
  notify();
}

export function addSnapshot(characterName: string, itemLevel: number): Snapshot[] {
  const today = new Date().toISOString().slice(0, 10);
  const existing = getSnapshots(characterName).filter((s) => s.date !== today);
  const updated = [...existing, { date: today, itemLevel }].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  saveSnapshots(characterName, updated);
  return updated;
}

export function deleteSnapshot(characterName: string, date: string): Snapshot[] {
  const updated = getSnapshots(characterName).filter((s) => s.date !== date);
  saveSnapshots(characterName, updated);
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

export interface TrackedSummary {
  name: string;
  latest: Snapshot;
  count: number;
}

// 홈 화면용 요약입니다. 기록이 비어 있는 키는 건너뛰고, 마지막 기록일이 최근인 캐릭터부터 정렬합니다.
export function getTrackedSummaries(): TrackedSummary[] {
  return getTrackedCharacterNames()
    .flatMap((name) => {
      const snapshots = getSnapshots(name);
      const latest = snapshots.at(-1);
      return latest ? [{ name, latest, count: snapshots.length }] : [];
    })
    .sort(
      (a, b) =>
        b.latest.date.localeCompare(a.latest.date) || a.name.localeCompare(b.name),
    );
}
