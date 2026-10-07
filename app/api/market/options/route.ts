import { NextResponse } from "next/server";
import { getMarketOptions } from "@/lib/lostark";
import { cacheMeta, getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import type { MarketOptions } from "@/lib/market";

// 요청 정보를 전혀 읽지 않는 GET 라우트는 Next 14가 빌드 때 한 번 실행해서 정적 파일로 굳힙니다.
// 그러면 빌드 시점(CI는 가짜 API 키)의 응답이 영원히 고정되므로, 요청마다 실행하도록 지정합니다.
export const dynamic = "force-dynamic";

export async function GET() {
  const cacheKey = "market:options";
  const cached = getCached<MarketOptions>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached.value, ...cacheMeta(cached, true) });
  }

  try {
    const options = await getMarketOptions();
    const entry = setCached(cacheKey, options);
    return NextResponse.json({ ...options, ...cacheMeta(entry, false) });
  } catch (err) {
    return toErrorResponse(err, "거래소 검색 옵션을 불러오는 중 오류가 발생했습니다.");
  }
}
