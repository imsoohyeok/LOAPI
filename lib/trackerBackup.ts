// 트래커 기록(localStorage)을 JSON 파일로 내보내고 다시 불러오는 데이터 계층입니다.
// 화면(DOM, 파일 선택)과 분리해 두어서 형식 검증과 병합 규칙을 순수 함수로 테스트할 수 있습니다.
import { z } from "zod";
import {
  getSnapshots,
  getTrackedCharacterNames,
  writeSnapshotsBulk,
  type Snapshot,
} from "@/lib/storage";

// 파일만 보고도 "이 앱의 트래커 백업"인지 알 수 있게 종류와 형식 버전을 같이 적습니다.
// 나중에 저장 형식이 바뀌면 version을 올리고, 불러올 때 버전별로 변환하면 됩니다.
export const BACKUP_KIND = "lostark-tracker-backup";
export const BACKUP_VERSION = 1;

// 수십 캐릭터 × 수년 치 기록도 수백 KB를 넘지 않습니다. 실수로 큰 파일을 고르면
// 읽고 파싱하는 동안 화면이 멈추므로 읽기 전에 크기로 거릅니다.
export const MAX_BACKUP_BYTES = 1024 * 1024;

// "2026-02-30"처럼 형식만 맞는 날짜를 막기 위해, 실제 달력 날짜로 되돌렸을 때 같은지 확인합니다.
const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

const SnapshotSchema = z.object({
  date: DateSchema,
  itemLevel: z.number().finite().positive(),
});

const CharacterNameSchema = z
  .string()
  .max(40)
  .refine((name) => name.trim() !== "" && name === name.trim());

export const TrackerBackupSchema = z.object({
  kind: z.literal(BACKUP_KIND),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  characters: z.record(CharacterNameSchema, z.array(SnapshotSchema)),
});
export type TrackerBackup = z.infer<typeof TrackerBackupSchema>;

// 버전을 먼저 따로 읽어서 "다른 파일"과 "더 새 버전의 백업"을 구분해 안내합니다.
const BackupHeaderSchema = z.object({
  kind: z.literal(BACKUP_KIND),
  version: z.number(),
});

export type ParseBackupResult =
  { ok: true; backup: TrackerBackup } | { ok: false; error: string };

export function createBackup(now: Date = new Date()): TrackerBackup {
  const characters: Record<string, Snapshot[]> = {};
  // 이름순으로 넣어 두면 같은 기록을 두 번 내보냈을 때 파일 내용이 같아서 비교하기 쉽습니다.
  for (const name of getTrackedCharacterNames().sort((a, b) => a.localeCompare(b))) {
    const snapshots = getSnapshots(name);
    if (snapshots.length > 0) characters[name] = snapshots;
  }
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    characters,
  };
}

export function backupFileName(now: Date = new Date()): string {
  // 사용자가 보는 파일명이므로 UTC가 아니라 이 기기의 날짜를 씁니다.
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `lostark-tracker-backup-${date}.json`;
}

export function countSnapshots(backup: TrackerBackup): number {
  return Object.values(backup.characters).reduce((sum, list) => sum + list.length, 0);
}

// 파일 내용은 사용자가 고른 임의의 문자열이므로, 타입 단언 없이 스키마로 검증한 결과만 넘깁니다.
export function parseBackup(text: string): ParseBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON 파일이 아니에요." };
  }

  const header = BackupHeaderSchema.safeParse(data);
  if (!header.success) {
    return { ok: false, error: "트래커 백업 파일이 아니에요." };
  }
  if (header.data.version > BACKUP_VERSION) {
    return {
      ok: false,
      error:
        "이 사이트보다 새 버전에서 만든 백업이에요. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    };
  }

  const result = TrackerBackupSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, error: "백업 파일의 내용이 손상되었거나 형식이 맞지 않아요." };
  }
  return { ok: true, backup: result.data };
}

export interface ImportPlan {
  // 실제로 바뀌는 캐릭터의 병합 결과만 담습니다. 비어 있으면 쓸 것이 없습니다.
  writes: Record<string, Snapshot[]>;
  added: number; // 새로 추가되는 기록 수
  skipped: number; // 이미 같은 날짜 기록이 있어 건너뛴 수
}

// 불러오기는 "병합"입니다. 기존 기록은 지우거나 바꾸지 않고, 없는 날짜만 더합니다.
// - 같은 날짜가 양쪽에 있으면 이 기기의 기록을 남깁니다. 실수로 오래된 백업을 불러와도 잃는 것이 없고,
//   같은 파일을 두 번 불러와도 결과가 같습니다(멱등).
// - 기존 값을 읽는 함수를 인자로 받아서 localStorage 없이도 규칙만 테스트할 수 있습니다.
export function planImport(
  backup: TrackerBackup,
  readExisting: (name: string) => Snapshot[] = getSnapshots,
): ImportPlan {
  const writes: Record<string, Snapshot[]> = {};
  let added = 0;
  let skipped = 0;

  for (const [name, incoming] of Object.entries(backup.characters)) {
    const byDate = new Map(readExisting(name).map((s) => [s.date, s]));
    let changed = false;
    for (const snapshot of incoming) {
      if (byDate.has(snapshot.date)) {
        skipped++;
        continue;
      }
      byDate.set(snapshot.date, { date: snapshot.date, itemLevel: snapshot.itemLevel });
      added++;
      changed = true;
    }
    if (changed) {
      writes[name] = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  return { writes, added, skipped };
}

export function applyImport(plan: ImportPlan) {
  if (Object.keys(plan.writes).length > 0) writeSnapshotsBulk(plan.writes);
}
