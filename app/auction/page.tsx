import { Suspense } from "react";
import type { Metadata } from "next";
import AuctionView from "./AuctionView";

interface AuctionPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

// 거래소 페이지처럼 검색 링크를 공유하면 미리보기 제목에 검색어가 보이게 합니다.
export function generateMetadata({ searchParams }: AuctionPageProps): Metadata {
  const raw = searchParams.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const title = query
    ? `${query} 매물 · 경매장 | 로스트아크 툴즈`
    : "경매장 | 로스트아크 툴즈";
  return { title, openGraph: { title } };
}

export default function AuctionPage() {
  // AuctionView가 useSearchParams로 URL을 읽으므로 Suspense 경계를 둡니다.
  return (
    <Suspense>
      <AuctionView />
    </Suspense>
  );
}
