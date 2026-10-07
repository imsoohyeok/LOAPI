import { NextRequest, NextResponse } from "next/server";
import { searchMarketItems } from "@/lib/lostark";
import { cacheMeta, getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import { readMarketFilters, toMarketItemsRequest } from "@/lib/marketParams";
import type { MarketItemsPage } from "@/lib/market";

// 로스트아크 API는 POST지만 프록시는 GET으로 열어 둡니다. 검색 조건이 URL에 그대로 드러나서
// 클라이언트의 쿼리 키·브라우저 URL과 1:1로 대응하고, 같은 조건이면 같은 캐시 키가 됩니다.
export async function GET(request: NextRequest) {
  // 페이지 URL을 읽는 것과 같은 함수로 읽어서, 잘못된 값은 클라이언트와 똑같이 기본값으로 바뀝니다.
  const body = toMarketItemsRequest(readMarketFilters(request.nextUrl.searchParams));

  const cacheKey = `market:items:${JSON.stringify(body)}`;
  const cached = getCached<MarketItemsPage>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached.value, ...cacheMeta(cached, true) });
  }

  try {
    const page = await searchMarketItems(body);
    const entry = setCached(cacheKey, page);
    return NextResponse.json({ ...page, ...cacheMeta(entry, false) });
  } catch (err) {
    return toErrorResponse(err, "거래소 시세를 불러오는 중 오류가 발생했습니다.");
  }
}
