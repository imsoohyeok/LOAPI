import type { MarketItem, MarketSort, SortCondition } from "@/lib/market";
import { priceChangeRate } from "@/lib/market";
import { getGradeStyle } from "@/lib/grades";

interface MarketItemTableProps {
  items: MarketItem[];
  sort: MarketSort;
  order: SortCondition;
  onSort: (sort: MarketSort) => void;
}

const priceFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
const rateFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

// 화면이 좁으면 전일 평균가·최근 거래가 열을 숨기고 현재 최저가만 남깁니다.
const COLUMNS: { sort: MarketSort; label: string; className: string }[] = [
  { sort: "YDAY_AVG_PRICE", label: "전일 평균가", className: "hidden sm:table-cell" },
  { sort: "RECENT_PRICE", label: "최근 거래가", className: "hidden sm:table-cell" },
  { sort: "CURRENT_MIN_PRICE", label: "현재 최저가", className: "" },
];

export default function MarketItemTable({
  items,
  sort,
  order,
  onSort,
}: MarketItemTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-xs text-gray-500">
          <tr>
            <SortableHeader
              label="아이템"
              title="등급순으로 정렬"
              active={sort === "GRADE"}
              order={order}
              onClick={() => onSort("GRADE")}
              className="text-left"
            />
            {COLUMNS.map((column) => (
              <SortableHeader
                key={column.sort}
                label={column.label}
                active={sort === column.sort}
                order={order}
                onClick={() => onSort(column.sort)}
                className={`text-right ${column.className}`}
                arrowFirst
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <MarketItemRow key={item.Id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  title,
  active,
  order,
  onClick,
  className,
  arrowFirst = false,
}: {
  label: string;
  title?: string;
  active: boolean;
  order: SortCondition;
  onClick: () => void;
  className: string;
  // 오른쪽 정렬 열은 화살표를 앞에 둬야 머리글 글자 끝이 아래 숫자 끝과 맞습니다.
  arrowFirst?: boolean;
}) {
  // 스크린 리더는 aria-sort로 "오름차순 정렬됨" 같은 상태를 읽어 줍니다.
  const ariaSort = active ? (order === "ASC" ? "ascending" : "descending") : undefined;
  return (
    <th scope="col" aria-sort={ariaSort} className={`px-4 py-2.5 font-bold ${className}`}>
      <button
        type="button"
        title={title}
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded ${arrowFirst ? "flex-row-reverse" : ""} hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active ? "text-accent" : ""
        }`}
      >
        {label}
        <span aria-hidden className={active ? "" : "invisible"}>
          {order === "ASC" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

function MarketItemRow({ item }: { item: MarketItem }) {
  const style = getGradeStyle(item.Grade);
  const rate = priceChangeRate(item.CurrentMinPrice, item.YDayAvgPrice);

  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {item.Icon ? (
            // 아이콘은 로스트아크 CDN의 작은 고정 크기 이미지라서 next/image 최적화(리사이즈·포맷 변환)로
            // 얻을 게 거의 없고, 원격 도메인 설정과 서버 변환 비용만 늘어납니다. 크기를 고정해 레이아웃 이동만 막습니다.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.Icon}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              className="h-9 w-9 shrink-0 rounded-md border"
              style={{ borderColor: style.border, backgroundColor: style.bg }}
            />
          ) : (
            <span aria-hidden className="h-9 w-9 shrink-0 rounded-md bg-bg" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium" style={{ color: style.color }}>
              {item.Name}
            </p>
            <p className="text-xs text-gray-500">
              {item.BundleCount > 1 && `${item.BundleCount}개 단위 · `}
              {item.Grade}
              {item.TradeRemainCount != null && ` · 거래 ${item.TradeRemainCount}회 가능`}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-right font-mono text-gray-400 sm:table-cell">
        {priceFormatter.format(item.YDayAvgPrice)}
      </td>
      <td className="hidden px-4 py-3 text-right font-mono text-gray-400 sm:table-cell">
        {priceFormatter.format(item.RecentPrice)}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono font-bold text-gold">
          {priceFormatter.format(item.CurrentMinPrice)}
        </span>
        <span className="ml-0.5 text-xs text-gray-500">G</span>
        {rate !== null && <ChangeRate rate={rate} />}
      </td>
    </tr>
  );
}

// 국내 시세 표기 관례대로 상승은 빨강, 하락은 파랑으로 칠합니다.
function ChangeRate({ rate }: { rate: number }) {
  const rounded = Math.round(rate * 10) / 10;
  const color =
    rounded > 0 ? "text-red-400" : rounded < 0 ? "text-blue-400" : "text-gray-500";
  return (
    <span className={`block text-xs ${color}`}>
      <span className="sr-only">전일 평균 대비 </span>
      {rateFormatter.format(rounded)}%
    </span>
  );
}
