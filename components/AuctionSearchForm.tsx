"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { AuctionEtcOption, AuctionOptions } from "@/lib/auction";
import {
  formatOptionFilter,
  MAX_OPTION_FILTERS,
  type AuctionFilters,
  type AuctionOptionFilter,
} from "@/lib/auctionParams";

interface AuctionSearchFormProps {
  filters: AuctionFilters;
  options: AuctionOptions | undefined;
  optionsError: boolean;
  onChange: (patch: Partial<AuctionFilters>) => void;
}

// 입력 중인 옵션 조건 한 줄. 아직 고르지 않은 칸(null, "")이 있을 수 있어서 URL용 타입과 따로 둡니다.
export interface OptionDraft {
  first: number | null;
  second: number | null;
  min: string;
  max: string;
}

const toDraft = (option: AuctionOptionFilter): OptionDraft => ({
  first: option.first,
  second: option.second,
  min: option.min === null ? "" : String(option.min),
  max: option.max === null ? "" : String(option.max),
});

const toNumber = (value: string): number | null =>
  /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;

// 1·2단계를 모두 고른 줄만 조건이 됩니다. 최솟값이 최댓값보다 크면 뒤바꿔서, 사용자가
// 칸을 헷갈려 입력했을 때 "결과 없음"이 되는 대신 의도한 범위로 검색합니다.
export function draftsToFilters(drafts: OptionDraft[]): AuctionOptionFilter[] {
  return drafts.flatMap((draft) => {
    if (draft.first === null || draft.second === null) return [];
    let min = toNumber(draft.min);
    let max = toNumber(draft.max);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    return [{ first: draft.first, second: draft.second, min, max }];
  });
}

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent disabled:text-gray-500";

export default function AuctionSearchForm({
  filters,
  options,
  optionsError,
  onChange,
}: AuctionSearchFormProps) {
  // 카테고리·등급·티어·품질 같은 선택 상자는 바꾸는 즉시 검색하고, 글자를 입력하는 검색어와
  // 옵션 조건은 "검색"을 눌렀을 때만 URL에 반영합니다. 한 글자·한 칸마다 요청하면
  // 분당 요청 한도를 금방 쓰고, 반쯤 고른 옵션(1단계만 고른 상태)으로 검색하게 되기 때문입니다.
  const [text, setText] = useState(filters.query);
  const [drafts, setDrafts] = useState<OptionDraft[]>(() => filters.options.map(toDraft));

  // 뒤로가기 등으로 URL이 바뀌면 입력 중인 내용도 URL을 따라갑니다(거래소 폼과 같은 렌더 중 동기화).
  const urlOptionsKey = filters.options.map(formatOptionFilter).join("&");
  const [prev, setPrev] = useState({ query: filters.query, options: urlOptionsKey });
  if (prev.query !== filters.query || prev.options !== urlOptionsKey) {
    setPrev({ query: filters.query, options: urlOptionsKey });
    setText(filters.query);
    setDrafts(filters.options.map(toDraft));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onChange({ query: text.trim(), options: draftsToFilters(drafts) });
  }

  function updateDraft(index: number, patch: Partial<OptionDraft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  const categories = options?.Categories ?? [];
  const knownCategory = categories.some(
    (c) => c.Code === filters.category || c.Subs.some((s) => s.Code === filters.category),
  );
  const etcOptions = options?.EtcOptions ?? [];

  return (
    <form role="search" onSubmit={handleSubmit} className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SelectField
          id="auction-category"
          label="카테고리"
          value={filters.category}
          disabled={!options}
          onChange={(value) => onChange({ category: Number(value) })}
        >
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
        </SelectField>

        <SelectField
          id="auction-grade"
          label="등급"
          value={filters.grade ?? ""}
          disabled={!options}
          onChange={(value) => onChange({ grade: value || null })}
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
        </SelectField>

        <SelectField
          id="auction-tier"
          label="티어"
          value={filters.tier ?? ""}
          disabled={!options}
          onChange={(value) => onChange({ tier: value ? Number(value) : null })}
        >
          <option value="">모든 티어</option>
          {filters.tier !== null && !options?.ItemTiers.includes(filters.tier) && (
            <option value={filters.tier}>{filters.tier}티어</option>
          )}
          {options?.ItemTiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier}티어
            </option>
          ))}
        </SelectField>

        <SelectField
          id="auction-quality"
          label="최소 품질"
          value={filters.quality ?? ""}
          disabled={!options}
          onChange={(value) => onChange({ quality: value ? Number(value) : null })}
        >
          <option value="">품질 무관</option>
          {filters.quality !== null &&
            !options?.ItemGradeQualities.includes(filters.quality) && (
              <option value={filters.quality}>품질 {filters.quality} 이상</option>
            )}
          {options?.ItemGradeQualities.map((quality) => (
            <option key={quality} value={quality}>
              품질 {quality} 이상
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset className="rounded-xl border border-border p-3">
        <legend className="px-1 text-xs font-bold text-gray-500">옵션 조건</legend>
        {drafts.length === 0 && (
          <p className="mb-2 text-xs text-gray-500">
            보석 효과나 연마 효과처럼 매물에 붙은 옵션으로 좁혀 볼 수 있어요.
          </p>
        )}
        <ul className="space-y-2">
          {drafts.map((draft, index) => (
            <OptionRow
              key={index}
              index={index}
              draft={draft}
              etcOptions={etcOptions}
              disabled={!options}
              onChange={(patch) => updateDraft(index, patch)}
              onRemove={() =>
                setDrafts((current) => current.filter((_, i) => i !== index))
              }
            />
          ))}
        </ul>
        {drafts.length < MAX_OPTION_FILTERS && (
          <button
            type="button"
            disabled={!options}
            onClick={() =>
              setDrafts((current) => [
                ...current,
                { first: null, second: null, min: "", max: "" },
              ])
            }
            className="mt-2 rounded-lg px-2 py-1 text-xs text-accent hover:bg-surface disabled:text-gray-600"
          >
            + 옵션 추가
          </button>
        )}
      </fieldset>

      <div className="flex gap-2">
        <label className="sr-only" htmlFor="auction-query">
          아이템 이름
        </label>
        <input
          id="auction-query"
          type="search"
          placeholder="아이템 이름 (예: 겁화)"
          value={text}
          maxLength={30}
          onChange={(e) => setText(e.target.value)}
          className={`${fieldClass} flex-1 placeholder:text-gray-500`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          검색
        </button>
      </div>

      {optionsError && (
        <p className="text-xs text-red-300">
          검색 옵션을 불러오지 못했어요. 지금 조건으로는 계속 검색할 수 있어요.
        </p>
      )}
    </form>
  );
}

function SelectField({
  id,
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string | number;
  disabled: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      >
        {children}
      </select>
    </div>
  );
}

function OptionRow({
  index,
  draft,
  etcOptions,
  disabled,
  onChange,
  onRemove,
}: {
  index: number;
  draft: OptionDraft;
  etcOptions: AuctionEtcOption[];
  disabled: boolean;
  onChange: (patch: Partial<OptionDraft>) => void;
  onRemove: () => void;
}) {
  const n = index + 1;
  const first = etcOptions.find((option) => option.Value === draft.first);
  const sub = first?.EtcSubs.find((s) => s.Value === draft.second);
  // 연마 효과처럼 고를 수 있는 값이 정해진 옵션은 숫자 입력 대신 목록에서 고르게 합니다.
  const values = sub?.EtcValues ?? null;

  function rangeField(key: "min" | "max", label: string) {
    const id = `auction-opt-${n}-${key}`;
    return (
      <div className="order-1 sm:order-none">
        <label className="sr-only" htmlFor={id}>
          옵션 {n} {label}
        </label>
        {values ? (
          <select
            id={id}
            value={draft[key]}
            disabled={disabled}
            onChange={(e) => onChange({ [key]: e.target.value })}
            className={fieldClass}
          >
            <option value="">{label}</option>
            {values.map((v) => (
              <option key={v.Value} value={v.Value}>
                {v.DisplayValue}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={label}
            value={draft[key]}
            disabled={disabled}
            onChange={(e) => onChange({ [key]: e.target.value })}
            className={`${fieldClass} placeholder:text-gray-500`}
          />
        )}
      </div>
    );
  }

  return (
    // 좁은 화면에서는 [종류 | 효과 | 삭제] / [최소 | 최대] 두 줄로, 넓은 화면에서는 한 줄로 놓습니다.
    // DOM 순서는 읽는 순서(종류 → 효과 → 최소 → 최대 → 삭제)로 두고, 좁은 화면에서만 최소·최대를 order로 뒤로 보냅니다.
    <li className="grid grid-cols-[1fr_1fr_2.5rem] gap-2 sm:grid-cols-[1fr_1fr_5rem_5rem_2.5rem]">
      <div>
        <label className="sr-only" htmlFor={`auction-opt-${n}-first`}>
          옵션 {n} 종류
        </label>
        <select
          id={`auction-opt-${n}-first`}
          value={draft.first ?? ""}
          disabled={disabled}
          // 1단계를 바꾸면 이전 2단계·값은 다른 옵션의 것이라 의미가 없어서 비웁니다.
          onChange={(e) =>
            onChange({
              first: e.target.value ? Number(e.target.value) : null,
              second: null,
              min: "",
              max: "",
            })
          }
          className={fieldClass}
        >
          <option value="">옵션 종류</option>
          {draft.first !== null && !first && (
            <option value={draft.first}>옵션 {draft.first}</option>
          )}
          {etcOptions.map((option) => (
            <option key={option.Value} value={option.Value}>
              {option.Text}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="sr-only" htmlFor={`auction-opt-${n}-second`}>
          옵션 {n} 효과
        </label>
        <select
          id={`auction-opt-${n}-second`}
          value={draft.second ?? ""}
          disabled={disabled || draft.first === null}
          onChange={(e) =>
            onChange({
              second: e.target.value ? Number(e.target.value) : null,
              min: "",
              max: "",
            })
          }
          className={fieldClass}
        >
          <option value="">효과 선택</option>
          {draft.second !== null && !sub && (
            <option value={draft.second}>효과 {draft.second}</option>
          )}
          {first?.EtcSubs.map((s) => (
            <option key={s.Value} value={s.Value}>
              {s.Class ? `${s.Text} (${s.Class})` : s.Text}
            </option>
          ))}
        </select>
      </div>
      {rangeField("min", "최소")}
      {rangeField("max", "최대")}
      <button
        type="button"
        aria-label={`옵션 ${n} 삭제`}
        onClick={onRemove}
        className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-surface hover:text-gray-200"
      >
        ✕
      </button>
    </li>
  );
}
