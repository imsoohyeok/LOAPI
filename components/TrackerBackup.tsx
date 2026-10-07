"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { downloadJson, readFileAsText } from "@/lib/file";
import {
  MAX_BACKUP_BYTES,
  applyImport,
  backupFileName,
  countSnapshots,
  createBackup,
  parseBackup,
  planImport,
} from "@/lib/trackerBackup";

interface TrackerBackupProps {
  // 내보낼 기록이 없으면 내보내기를 막습니다. 불러오기는 빈 기기(새 PC)에서 가장 필요하므로 항상 엽니다.
  hasRecords: boolean;
}

type Message = { tone: "success" | "error"; text: string };

export default function TrackerBackup({ hasRecords }: TrackerBackupProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);

  function handleExport() {
    downloadJson(backupFileName(), createBackup());
    setMessage(null);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    // 값을 비워 두어야 같은 파일을 다시 골라도 change 이벤트가 다시 발생합니다.
    input.value = "";
    if (!file) return;
    setMessage(await importFile(file));
  }

  return (
    <section aria-label="기록 백업" className="mb-6 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-gray-500">기록 백업</span>
      <button
        type="button"
        onClick={handleExport}
        disabled={!hasRecords}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-accent hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-gray-300"
      >
        파일로 내보내기
      </button>
      {/* 파일 선택 창은 <input type="file">만 열 수 있어서, 숨긴 input을 버튼으로 대신 엽니다. */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-accent hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        파일에서 불러오기
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        aria-label="백업 파일 선택"
        tabIndex={-1}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* role="status"는 aria-live="polite"라서 결과가 바뀌면 스크린 리더가 읽어 줍니다. */}
      <p
        role="status"
        className={`basis-full text-xs ${message?.tone === "error" ? "text-red-400" : "text-green-400"}`}
      >
        {message?.text}
      </p>
    </section>
  );
}

async function importFile(file: File): Promise<Message> {
  if (file.size > MAX_BACKUP_BYTES) {
    return {
      tone: "error",
      text: "파일이 너무 커요. 트래커에서 내보낸 백업 파일인지 확인해 주세요.",
    };
  }

  let text: string;
  try {
    text = await readFileAsText(file);
  } catch {
    return { tone: "error", text: "파일을 읽지 못했어요." };
  }

  const parsed = parseBackup(text);
  if (!parsed.ok) return { tone: "error", text: parsed.error };

  const plan = planImport(parsed.backup);
  try {
    applyImport(plan);
  } catch {
    return {
      tone: "error",
      text: "브라우저 저장 공간이 부족해서 불러오지 못했어요. 기존 기록은 그대로예요.",
    };
  }

  if (countSnapshots(parsed.backup) === 0) {
    return { tone: "success", text: "백업 파일에 기록이 없어요." };
  }
  if (plan.added === 0) {
    return {
      tone: "success",
      text: "새로 추가할 기록이 없어요. 모두 이미 있는 날짜예요.",
    };
  }
  const characters = Object.keys(plan.writes).length;
  const kept =
    plan.skipped > 0
      ? ` 이미 있던 날짜 ${plan.skipped}개는 이 기기의 기록을 그대로 뒀어요.`
      : "";
  return {
    tone: "success",
    text: `캐릭터 ${characters}명의 기록 ${plan.added}개를 불러왔어요.${kept}`,
  };
}
