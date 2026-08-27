"use client";

import { useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (name: string) => void | Promise<unknown>;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch(value.trim());
  }

  return (
    <form className="mb-8 flex gap-2" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="캐릭터명을 입력하세요"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
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
