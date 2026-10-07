"use client";

import type { MouseEvent } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  // 각 페이지 링크의 실제 주소. 진짜 <a href>라서 새 탭으로 열기·주소 복사가 됩니다.
  hrefFor: (page: number) => string;
  onNavigate: (page: number) => void;
  onPrefetch?: (page: number) => void;
}

const WINDOW = 5;

// 현재 페이지를 가운데에 두고 최대 5개 번호를 보여줍니다. 끝에 가까우면 창을 안쪽으로 밉니다.
export function pageWindow(page: number, totalPages: number, size = WINDOW): number[] {
  const count = Math.min(size, totalPages);
  const start = Math.min(
    Math.max(1, page - Math.floor(size / 2)),
    Math.max(1, totalPages - count + 1),
  );
  return Array.from({ length: count }, (_, i) => start + i);
}

export default function Pagination({
  page,
  totalPages,
  hrefFor,
  onNavigate,
  onPrefetch,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function handleClick(e: MouseEvent<HTMLAnchorElement>, target: number) {
    // Ctrl/Cmd/Shift 클릭이나 휠 클릭은 브라우저 기본 동작(새 탭 등)에 맡깁니다.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(target);
  }

  const linkClass =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  function edge(target: number, label: string, text: string) {
    const disabled = target < 1 || target > totalPages;
    if (disabled) {
      return (
        <span aria-hidden className={`${linkClass} text-gray-700`}>
          {text}
        </span>
      );
    }
    return (
      <a
        href={hrefFor(target)}
        aria-label={label}
        onClick={(e) => handleClick(e, target)}
        onMouseEnter={() => onPrefetch?.(target)}
        onFocus={() => onPrefetch?.(target)}
        className={`${linkClass} text-gray-400 hover:bg-surface hover:text-gray-100`}
      >
        {text}
      </a>
    );
  }

  return (
    <nav aria-label="페이지" className="mt-4 flex items-center justify-center gap-1">
      {edge(page - 1, "이전 페이지", "‹")}
      {pageWindow(page, totalPages).map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className={`${linkClass} bg-accent font-semibold text-white`}
          >
            {n}
          </span>
        ) : (
          <a
            key={n}
            href={hrefFor(n)}
            aria-label={`${n}페이지`}
            onClick={(e) => handleClick(e, n)}
            className={`${linkClass} font-mono text-gray-400 hover:bg-surface hover:text-gray-100`}
          >
            {n}
          </a>
        ),
      )}
      {edge(page + 1, "다음 페이지", "›")}
    </nav>
  );
}
