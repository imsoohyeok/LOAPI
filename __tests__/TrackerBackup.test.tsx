import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackerBackup from "@/components/TrackerBackup";
import { getSnapshots } from "@/lib/storage";
import { readFileAsText } from "@/lib/file";
import { BACKUP_KIND, BACKUP_VERSION } from "@/lib/trackerBackup";

function seed(name: string, snapshots: { date: string; itemLevel: number }[]) {
  window.localStorage.setItem(`lostark-tracker:${name}`, JSON.stringify(snapshots));
}

function backupFile(characters: Record<string, unknown>, name = "backup.json") {
  const body = JSON.stringify({
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: "2026-10-07T00:00:00.000Z",
    characters,
  });
  return new File([body], name, { type: "application/json" });
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("TrackerBackup 내보내기", () => {
  it("기록이 없으면 내보내기를 막는다", () => {
    render(<TrackerBackup hasRecords={false} />);
    expect(screen.getByRole("button", { name: "파일로 내보내기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "파일에서 불러오기" })).toBeEnabled();
  });

  it("저장된 기록을 JSON 파일로 내려받게 한다", async () => {
    const user = userEvent.setup();
    seed("바드", [{ date: "2026-10-01", itemLevel: 1675 }]);
    // jsdom에는 blob URL이 없어서, 만들어진 Blob을 붙잡아 두는 대역으로 바꿉니다.
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => {
      blob = b;
      return "blob:backup";
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.href).toBe("blob:backup");
        expect(this.download).toMatch(/^lostark-tracker-backup-\d{4}-\d{2}-\d{2}\.json$/);
      });

    render(<TrackerBackup hasRecords />);
    await user.click(screen.getByRole("button", { name: "파일로 내보내기" }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(blob?.type).toBe("application/json");
    const exported = JSON.parse(await readFileAsText(blob!));
    expect(exported).toMatchObject({
      kind: BACKUP_KIND,
      version: BACKUP_VERSION,
      characters: { 바드: [{ date: "2026-10-01", itemLevel: 1675 }] },
    });
  });
});

describe("TrackerBackup 불러오기", () => {
  it("백업을 기존 기록과 병합하고 결과를 알려준다", async () => {
    const user = userEvent.setup();
    seed("바드", [{ date: "2026-10-01", itemLevel: 1675 }]);
    render(<TrackerBackup hasRecords />);

    await user.upload(
      screen.getByLabelText("백업 파일 선택"),
      backupFile({
        바드: [
          { date: "2026-10-01", itemLevel: 9999 },
          { date: "2026-10-02", itemLevel: 1680 },
        ],
        가디언: [{ date: "2026-10-02", itemLevel: 1700 }],
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "캐릭터 2명의 기록 2개를 불러왔어요. 이미 있던 날짜 1개는 이 기기의 기록을 그대로 뒀어요.",
    );
    expect(getSnapshots("바드")).toEqual([
      { date: "2026-10-01", itemLevel: 1675 },
      { date: "2026-10-02", itemLevel: 1680 },
    ]);
    expect(getSnapshots("가디언")).toEqual([{ date: "2026-10-02", itemLevel: 1700 }]);
  });

  it("같은 파일을 다시 고르면 추가할 기록이 없다고 알려준다", async () => {
    const user = userEvent.setup();
    render(<TrackerBackup hasRecords={false} />);
    const input = screen.getByLabelText("백업 파일 선택");
    const file = backupFile({ 바드: [{ date: "2026-10-01", itemLevel: 1675 }] });

    await user.upload(input, file);
    expect(await screen.findByText(/기록 1개를 불러왔어요/)).toBeInTheDocument();

    await user.upload(input, file);
    expect(
      await screen.findByText("새로 추가할 기록이 없어요. 모두 이미 있는 날짜예요."),
    ).toBeInTheDocument();
  });

  it("잘못된 파일이면 오류를 보여주고 기록을 건드리지 않는다", async () => {
    const user = userEvent.setup({ applyAccept: false });
    seed("바드", [{ date: "2026-10-01", itemLevel: 1675 }]);
    render(<TrackerBackup hasRecords />);

    await user.upload(
      screen.getByLabelText("백업 파일 선택"),
      new File(["hello"], "note.txt", { type: "text/plain" }),
    );

    expect(await screen.findByText("JSON 파일이 아니에요.")).toBeInTheDocument();
    expect(getSnapshots("바드")).toEqual([{ date: "2026-10-01", itemLevel: 1675 }]);
  });

  it("너무 큰 파일은 읽기 전에 거절한다", async () => {
    const user = userEvent.setup();
    render(<TrackerBackup hasRecords={false} />);
    const big = new File(["x"], "big.json", { type: "application/json" });
    Object.defineProperty(big, "size", { value: 2 * 1024 * 1024 });

    await user.upload(screen.getByLabelText("백업 파일 선택"), big);

    expect(await screen.findByText(/파일이 너무 커요/)).toBeInTheDocument();
  });
});
