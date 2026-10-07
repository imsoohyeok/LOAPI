"use client";

import { useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (name: string) => void | Promise<unknown>;
  loading: boolean;
  // 바깥(URL 쿼리 등)에서 정해진 검색어. 바뀌면 입력창도 그 값으로 맞춥니다.
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  loading,
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  // 뒤로가기로 URL이 바뀌면 입력창도 따라가야 합니다. useEffect로 맞추면 한 번 옛 값으로
  // 그린 뒤 다시 그리게 되므로, 렌더 중에 이전 prop과 비교해서 바로 state를 고칩니다.
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setValue(initialValue);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch(value.trim());
  }

  return (
    <form className="mb-8 flex gap-2" onSubmit={handleSubmit}>
      {/* input은 기본 너비(size=20)가 있어서 flex 아이템의 min-width: auto가 그보다 줄어들지 못합니다.
          min-w-0이 없으면 좁은 화면에서 입력창이 검색 버튼을 화면 밖으로 밀어냅니다. */}
      <input
        type="text"
        placeholder="캐릭터명을 입력하세요"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-700"
      >
        {loading ? "검색 중..." : "검색"}
      </button>
    </form>
  );
}
