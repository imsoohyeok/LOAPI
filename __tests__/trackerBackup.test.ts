import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSnapshots, subscribeTracker, writeSnapshotsBulk } from "@/lib/storage";
import {
  BACKUP_KIND,
  BACKUP_VERSION,
  applyImport,
  backupFileName,
  countSnapshots,
  createBackup,
  parseBackup,
  planImport,
  type TrackerBackup,
} from "@/lib/trackerBackup";

function seed(name: string, value: unknown) {
  window.localStorage.setItem(`lostark-tracker:${name}`, JSON.stringify(value));
}

function backup(characters: TrackerBackup["characters"]): TrackerBackup {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: "2026-10-07T00:00:00.000Z",
    characters,
  };
}

beforeEach(() => window.localStorage.clear());

describe("createBackup", () => {
  it("트래커 기록만 이름순으로 담고, 비어 있거나 깨진 기록은 뺀다", () => {
    seed("바드", [
      { date: "2026-10-03", itemLevel: 1680 },
      { date: "2026-10-01", itemLevel: 1675 },
    ]);
    seed("가디언", [{ date: "2026-10-02", itemLevel: 1700 }]);
    seed("빈캐릭", []);
    window.localStorage.setItem("lostark-tracker:깨진캐릭", "{not json");
    window.localStorage.setItem("other-app", "[]");

    expect(createBackup(new Date("2026-10-07T01:02:03Z"))).toEqual({
      kind: BACKUP_KIND,
      version: BACKUP_VERSION,
      exportedAt: "2026-10-07T01:02:03.000Z",
      characters: {
        가디언: [{ date: "2026-10-02", itemLevel: 1700 }],
        바드: [
          { date: "2026-10-01", itemLevel: 1675 },
          { date: "2026-10-03", itemLevel: 1680 },
        ],
      },
    });
  });

  it("내보낸 파일을 그대로 다시 읽을 수 있다", () => {
    seed("바드", [{ date: "2026-10-01", itemLevel: 1675.83 }]);
    const exported = createBackup();
    expect(parseBackup(JSON.stringify(exported))).toEqual({ ok: true, backup: exported });
    expect(countSnapshots(exported)).toBe(1);
  });
});

describe("backupFileName", () => {
  it("기기 날짜로 파일명을 만든다", () => {
    expect(backupFileName(new Date(2026, 0, 5, 23, 59))).toBe(
      "lostark-tracker-backup-2026-01-05.json",
    );
  });
});

describe("parseBackup", () => {
  it("JSON이 아니면 거절한다", () => {
    expect(parseBackup("not json")).toEqual({
      ok: false,
      error: "JSON 파일이 아니에요.",
    });
  });

  it("다른 JSON 파일이면 거절한다", () => {
    expect(parseBackup(JSON.stringify({ hello: "world" }))).toEqual({
      ok: false,
      error: "트래커 백업 파일이 아니에요.",
    });
    expect(parseBackup("[]").ok).toBe(false);
  });

  it("더 새 버전의 백업이면 새로고침을 안내한다", () => {
    const result = parseBackup(JSON.stringify({ ...backup({}), version: 2 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("새 버전");
  });

  it.each([
    ["없는 날짜", { 바드: [{ date: "2026-02-30", itemLevel: 1680 }] }],
    ["날짜 형식", { 바드: [{ date: "2026/10/01", itemLevel: 1680 }] }],
    ["문자열 레벨", { 바드: [{ date: "2026-10-01", itemLevel: "1680" }] }],
    ["음수 레벨", { 바드: [{ date: "2026-10-01", itemLevel: -1 }] }],
    ["빈 이름", { " ": [{ date: "2026-10-01", itemLevel: 1680 }] }],
    ["배열이 아닌 기록", { 바드: { date: "2026-10-01", itemLevel: 1680 } }],
  ])("%s처럼 내용이 잘못되면 거절한다", (_, characters) => {
    const result = parseBackup(JSON.stringify({ ...backup({}), characters }));
    expect(result).toEqual({
      ok: false,
      error: "백업 파일의 내용이 손상되었거나 형식이 맞지 않아요.",
    });
  });

  it("모르는 필드는 버리고 필요한 값만 남긴다", () => {
    const result = parseBackup(
      JSON.stringify({
        ...backup({}),
        characters: { 바드: [{ date: "2026-10-01", itemLevel: 1680, memo: "x" }] },
        extra: true,
      }),
    );
    expect(result).toEqual({
      ok: true,
      backup: backup({ 바드: [{ date: "2026-10-01", itemLevel: 1680 }] }),
    });
  });
});

describe("planImport", () => {
  it("없는 날짜만 더하고, 같은 날짜는 이 기기의 기록을 남긴다", () => {
    const existing: Record<string, { date: string; itemLevel: number }[]> = {
      바드: [{ date: "2026-10-01", itemLevel: 1675 }],
    };
    const plan = planImport(
      backup({
        바드: [
          { date: "2026-10-01", itemLevel: 9999 },
          { date: "2026-09-30", itemLevel: 1670 },
        ],
        가디언: [{ date: "2026-10-02", itemLevel: 1700 }],
      }),
      (name) => existing[name] ?? [],
    );

    expect(plan).toEqual({
      writes: {
        바드: [
          { date: "2026-09-30", itemLevel: 1670 },
          { date: "2026-10-01", itemLevel: 1675 },
        ],
        가디언: [{ date: "2026-10-02", itemLevel: 1700 }],
      },
      added: 2,
      skipped: 1,
    });
  });

  it("백업 안에 같은 날짜가 겹치면 처음 것만 쓴다", () => {
    const plan = planImport(
      backup({
        바드: [
          { date: "2026-10-01", itemLevel: 1675 },
          { date: "2026-10-01", itemLevel: 1680 },
        ],
      }),
      () => [],
    );
    expect(plan.writes).toEqual({ 바드: [{ date: "2026-10-01", itemLevel: 1675 }] });
    expect(plan).toMatchObject({ added: 1, skipped: 1 });
  });

  it("같은 파일을 두 번 불러와도 결과가 같다", () => {
    const file = backup({ 바드: [{ date: "2026-10-01", itemLevel: 1675 }] });
    applyImport(planImport(file));
    const second = planImport(file);

    expect(second).toEqual({ writes: {}, added: 0, skipped: 1 });
    expect(getSnapshots("바드")).toEqual([{ date: "2026-10-01", itemLevel: 1675 }]);
  });
});

describe("writeSnapshotsBulk", () => {
  it("여러 캐릭터를 쓰고 구독자에게 한 번만 알린다", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTracker(listener);
    writeSnapshotsBulk({
      바드: [{ date: "2026-10-01", itemLevel: 1675 }],
      가디언: [{ date: "2026-10-02", itemLevel: 1700 }],
    });
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSnapshots("가디언")).toEqual([{ date: "2026-10-02", itemLevel: 1700 }]);
  });

  it("도중에 쓰기가 실패하면 이미 쓴 키를 되돌리고 오류를 던진다", () => {
    seed("바드", [{ date: "2026-09-01", itemLevel: 1600 }]);
    const listener = vi.fn();
    const unsubscribe = subscribeTracker(listener);
    const original = Storage.prototype.setItem;
    let calls = 0;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      // 두 번째 캐릭터를 쓸 때 용량 초과가 난 것처럼 만듭니다. 되돌리는 쓰기는 통과시킵니다.
      if (++calls === 2) throw new DOMException("full", "QuotaExceededError");
      original.call(this, key, value);
    });

    expect(() =>
      writeSnapshotsBulk({
        바드: [{ date: "2026-10-01", itemLevel: 1675 }],
        가디언: [{ date: "2026-10-02", itemLevel: 1700 }],
      }),
    ).toThrow("full");
    setItem.mockRestore();
    unsubscribe();

    expect(getSnapshots("바드")).toEqual([{ date: "2026-09-01", itemLevel: 1600 }]);
    expect(getSnapshots("가디언")).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
  });
});
