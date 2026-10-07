import {
  auctionItemKey,
  formatAuctionOption,
  formatTimeLeft,
  type AuctionItem,
} from "@/lib/auction";
import { getGradeStyle } from "@/lib/grades";

interface AuctionItemListProps {
  items: AuctionItem[];
  now: number;
}

const priceFormatter = new Intl.NumberFormat("ko-KR");

// 거래소는 표(가격 열 비교)가 맞지만, 경매장 매물은 옵션이 2~6줄씩 붙어서 표 칸에 넣으면
// 행 높이가 들쭉날쭉해지고 좁은 화면에서 읽기 어렵습니다. 그래서 매물 하나를 카드 한 장으로 그립니다.
export default function AuctionItemList({ items, now }: AuctionItemListProps) {
  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item, index) => (
        <AuctionItemRow key={auctionItemKey(item, index)} item={item} now={now} />
      ))}
    </ul>
  );
}

function AuctionItemRow({ item, now }: { item: AuctionItem; now: number }) {
  const style = getGradeStyle(item.Grade);
  const info = item.AuctionInfo;
  const meta = [
    item.Grade,
    item.Tier != null && `${item.Tier}티어`,
    item.GradeQuality != null && `품질 ${item.GradeQuality}`,
    info.TradeAllowCount != null && `거래 ${info.TradeAllowCount}회 가능`,
  ].filter(Boolean);

  return (
    <li className="flex gap-3 px-4 py-3">
      {item.Icon ? (
        // 거래소 표와 같은 이유로 next/image 대신 크기를 고정한 img를 씁니다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.Icon}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-md border"
          style={{ borderColor: style.border, backgroundColor: style.bg }}
        />
      ) : (
        <span aria-hidden className="h-10 w-10 shrink-0 rounded-md bg-bg" />
      )}

      <div className="min-w-0 flex-1">
        <p className="break-keep font-medium" style={{ color: style.color }}>
          {item.Name}
        </p>
        <p className="text-xs text-gray-500">{meta.join(" · ")}</p>
        {item.Options.length > 0 && (
          <ul aria-label="옵션" className="mt-1.5 flex flex-wrap gap-1">
            {item.Options.map((option, i) => (
              <li
                key={`${option.Type}-${option.OptionName}-${i}`}
                className={`rounded px-1.5 py-0.5 text-[11px] ${
                  option.IsPenalty ? "bg-red-950 text-red-300" : "bg-bg text-gray-300"
                }`}
              >
                {formatAuctionOption(option)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 text-right">
        {info.BuyPrice != null ? (
          <p>
            <span className="sr-only">즉시 구매가 </span>
            <span className="font-mono font-bold text-gold">
              {priceFormatter.format(info.BuyPrice)}
            </span>
            <span className="ml-0.5 text-xs text-gray-500">G</span>
          </p>
        ) : (
          <p className="text-xs text-gray-500">즉시 구매 불가</p>
        )}
        <p className="text-xs text-gray-500">
          {info.BidCount > 0 ? "현재 입찰가 " : "입찰 시작가 "}
          <span className="font-mono text-gray-400">
            {priceFormatter.format(
              info.BidCount > 0 ? info.BidPrice : info.BidStartPrice,
            )}
          </span>
        </p>
        <p className="text-xs text-gray-600">{formatTimeLeft(info.EndDate, now)}</p>
      </div>
    </li>
  );
}
