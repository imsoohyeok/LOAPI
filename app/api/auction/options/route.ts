import { NextResponse } from "next/server";
import { getAuctionOptions } from "@/lib/lostark";
import { cacheMeta, getCached, setCached } from "@/lib/cache";
import { toErrorResponse } from "@/lib/apiError";
import type { AuctionOptions } from "@/lib/auction";

// 거래소 옵션 라우트와 같은 이유로, 빌드 때 정적 파일로 굳지 않게 요청마다 실행합니다.
export const dynamic = "force-dynamic";

export async function GET() {
  const cacheKey = "auction:options";
  const cached = getCached<AuctionOptions>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached.value, ...cacheMeta(cached, true) });
  }

  try {
    const options = await getAuctionOptions();
    const entry = setCached(cacheKey, options);
    return NextResponse.json({ ...options, ...cacheMeta(entry, false) });
  } catch (err) {
    return toErrorResponse(err, "경매장 검색 옵션을 불러오는 중 오류가 발생했습니다.");
  }
}
