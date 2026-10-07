"use client";

import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

const LABEL: Record<CopyState, string> = {
  idle: "비교 링크 복사",
  copied: "복사됐어요!",
  failed: "복사 실패, 주소창을 복사해 주세요",
};

// 지금 주소(?a=&b= 포함)를 클립보드에 복사합니다. URL이 곧 비교 상태라서 따로 만들 게 없습니다.
export default function ShareButton() {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleClick() {
    try {
      // Clipboard API는 HTTPS(또는 localhost)에서만 있고, 권한이 막혀 있으면 reject됩니다.
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-accent hover:text-gray-100"
    >
      {/* 스크린 리더에도 복사 결과가 읽히도록 aria-live를 둡니다. */}
      <span aria-live="polite">{LABEL[state]}</span>
    </button>
  );
}
