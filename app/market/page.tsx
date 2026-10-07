import { Suspense } from "react";
import type { Metadata } from "next";
import MarketView from "./MarketView";

interface MarketPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

// 검색 링크를 공유하면 미리보기 제목에 검색어가 보이게 합니다.
export function generateMetadata({ searchParams }: MarketPageProps): Metadata {
  const raw = searchParams.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const title = query
    ? `${query} 시세 · 거래소 | 로스트아크 툴즈`
    : "거래소 | 로스트아크 툴즈";
  return { title, openGraph: { title } };
}

export default function MarketPage() {
  // MarketView가 useSearchParams로 URL을 읽으므로 비교 페이지와 같은 이유로 Suspense 경계를 둡니다.
  return (
    <Suspense>
      <MarketView />
    </Suspense>
  );
}
