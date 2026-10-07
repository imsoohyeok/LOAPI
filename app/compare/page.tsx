import { Suspense } from "react";
import type { Metadata } from "next";
import CompareView from "./CompareView";
import { compareTitle, readCompareNames } from "@/lib/compareParams";

interface ComparePageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

// 공유한 링크를 메신저에 붙였을 때 미리보기 제목이 "본캐 vs 부캐"로 보이게 합니다.
// searchParams를 읽으므로 이 페이지는 요청마다 렌더링(동적 렌더링)됩니다.
export function generateMetadata({ searchParams }: ComparePageProps): Metadata {
  // 같은 키가 여러 번 오면(?a=x&a=y) 클라이언트의 useSearchParams().get처럼 첫 값을 씁니다.
  const first = (key: string) => {
    const value = searchParams[key];
    return (Array.isArray(value) ? value[0] : value) ?? null;
  };
  const names = compareTitle(readCompareNames({ get: first }));
  const title = names
    ? `${names} · 캐릭터 비교 | 로스트아크 툴즈`
    : "캐릭터 비교 | 로스트아크 툴즈";
  return { title, openGraph: { title } };
}

export default function ComparePage() {
  // CompareView는 useSearchParams로 URL을 읽습니다. 지금은 generateMetadata 때문에 동적 렌더링이지만,
  // 나중에 정적 페이지가 되더라도 빌드가 깨지지 않도록 Suspense 경계를 둡니다.
  return (
    <Suspense>
      <CompareView />
    </Suspense>
  );
}
