"use client";

import { useState, type FormEvent } from "react";
import type { MarketOptions } from "@/lib/market";
import type { MarketFilters } from "@/lib/marketParams";

interface MarketSearchFormProps {
  filters: MarketFilters;
  options: MarketOptions | undefined;
  optionsError: boolean;
  onChange: (patch: Partial<MarketFilters>) => void;
}

const fieldClass =
  "rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent disabled:text-gray-500";

export default function MarketSearchForm({
  filters,
  options,
  optionsError,
  onChange,
}: MarketSearchFormProps) {
  // 검색어는 입력할 때마다가 아니라 제출할 때만 URL에 반영합니다. 글자마다 요청하면
  // 로스트아크 API의 분당 요청 한도를 금방 소모하고, 뒤로가기 기록도 글자 단위로 쌓입니다.
  const [text, setText] = useState(filters.query);
  // 뒤로가기로 URL의 검색어가 바뀌면 입력창도 따라갑니다(SearchBar와 같은 렌더 중 동기화 패턴).
  const [prevQuery, setPrevQuery] = useState(filters.query);
  if (filters.query !== prevQuery) {
    setPrevQuery(filters.query);
    setText(filters.query);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // 빈 검색어 제출도 허용합니다. 검색어를 지우고 카테고리 전체를 다시 보는 방법이기 때문입니다.
    onChange({ query: text.trim() });
  }

  const categories = options?.Categories ?? [];
  const knownCategory = categories.some(
    (c) => c.Code === filters.category || c.Subs.some((s) => s.Code === filters.category),
  );

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_1fr_auto]"
    >
      <label className="sr-only" htmlFor="market-category">
        카테고리
      </label>
      <select
        id="market-category"
        value={filters.category}
        disabled={!options}
        onChange={(e) => onChange({ category: Number(e.target.value) })}
        className={fieldClass}
      >
        {/* 옵션을 받기 전이나 목록에 없는 코드가 URL에 있어도 select가 엉뚱한 항목을 보여주지 않게 합니다 */}
        {!knownCategory && (
          <option value={filters.category}>
            {options ? `카테고리 ${filters.category}` : "카테고리 불러오는 중"}
          </option>
        )}
        {categories.map((category) => (
          <optgroup key={category.Code} label={category.CodeName}>
            <option value={category.Code}>{category.CodeName} 전체</option>
            {category.Subs.map((sub) => (
              <option key={sub.Code} value={sub.Code}>
                {sub.CodeName}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <label className="sr-only" htmlFor="market-grade">
        등급
      </label>
      <select
        id="market-grade"
        value={filters.grade ?? ""}
        disabled={!options}
        onChange={(e) => onChange({ grade: e.target.value || null })}
        className={fieldClass}
      >
        <option value="">모든 등급</option>
        {filters.grade && !options?.ItemGrades.includes(filters.grade) && (
          <option value={filters.grade}>{filters.grade}</option>
        )}
        {options?.ItemGrades.map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="market-query">
        아이템 이름
      </label>
      <input
        id="market-query"
        type="search"
        placeholder="아이템 이름 (예: 파괴석)"
        value={text}
        maxLength={30}
        onChange={(e) => setText(e.target.value)}
        className={`${fieldClass} col-span-2 placeholder:text-gray-500 sm:col-span-1`}
      />
      <button
        type="submit"
        className="col-span-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 sm:col-span-1"
      >
        검색
      </button>

      {optionsError && (
        <p className="col-span-full text-xs text-red-300">
          카테고리 목록을 불러오지 못했어요. 지금 카테고리로는 계속 검색할 수 있어요.
        </p>
      )}
    </form>
  );
}
