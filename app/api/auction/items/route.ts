import { NextRequest, NextResponse } from "next/server";
import { searchAuctionItems } from "@/lib/lostark";
import { cacheMeta, getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import { readAuctionFilters, toAuctionItemsRequest } from "@/lib/auctionParams";
import type { AuctionItemsPage } from "@/lib/auction";

// 거래소 프록시(/api/market/items)와 같은 방식입니다. 로스트아크는 POST지만 GET으로 열어서
// 검색 조건이 URL에 드러나고, 페이지 URL과 같은 함수로 읽어서 기본값·허용 범위가 클라이언트와 같습니다.
export async function GET(request: NextRequest) {
  const body = toAuctionItemsRequest(readAuctionFilters(request.nextUrl.searchParams));

  // 경매장 매물은 거래소 시세보다 빨리 바뀌지만(즉시 구매로 사라짐), 같은 조건을 여러 사람이
  // 연달아 조회할 때 API 한도를 아끼는 게 더 중요해서 다른 라우트와 같은 캐시를 씁니다.
  const cacheKey = `auction:items:${JSON.stringify(body)}`;
  const cached = getCached<AuctionItemsPage>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached.value, ...cacheMeta(cached, true) });
  }

  try {
    const page = await searchAuctionItems(body);
    const entry = setCached(cacheKey, page);
    return NextResponse.json({ ...page, ...cacheMeta(entry, false) });
  } catch (err) {
    return toErrorResponse(err, "경매장 매물을 불러오는 중 오류가 발생했습니다.");
  }
}
