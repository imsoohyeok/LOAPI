import Link from "next/link";
import type { TrackedSummary } from "@/lib/storage";
import { trackerHref } from "@/lib/trackerParams";

interface TrackerCharacterSwitcherProps {
  // null이면 아직 localStorage를 읽기 전(서버 렌더링·하이드레이션)입니다.
  summaries: TrackedSummary[] | null;
  current: string | null;
}

export default function TrackerCharacterSwitcher({
  summaries,
  current,
}: TrackerCharacterSwitcherProps) {
  if (!summaries || summaries.length === 0) return null;

  return (
    <nav aria-label="기록한 캐릭터" className="mb-4">
      {/* 캐릭터가 많아도 한 줄을 유지하고, 좁은 화면에서는 가로로 스크롤합니다. */}
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {summaries.map(({ name }) => {
          const active = name === current;
          return (
            <li key={name} className="shrink-0">
              {/* 버튼이 아니라 링크라서 새 탭으로 열거나 주소를 복사할 수 있습니다.
                  같은 페이지 안에서 쿼리만 바뀌므로 스크롤 위치는 그대로 둡니다. */}
              <Link
                href={trackerHref(name)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full border px-3 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "border-accent bg-accent/15 font-semibold text-gray-50"
                    : "border-border text-gray-400 hover:border-accent hover:text-gray-100"
                }`}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
