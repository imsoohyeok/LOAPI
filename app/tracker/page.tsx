import { Suspense } from "react";
import type { Metadata } from "next";
import TrackerView from "./TrackerView";

export const metadata: Metadata = { title: "성장 트래커 | 로스트아크 툴즈" };

export default function TrackerPage() {
  // TrackerView는 useSearchParams로 ?name=을 읽습니다. 이 페이지는 정적으로 빌드되므로
  // Suspense 경계가 없으면 Next가 빌드를 막습니다. 경계 바깥은 미리 렌더링된 HTML로 나가고,
  // 경계 안쪽만 브라우저에서 URL을 읽은 뒤 그려집니다.
  return (
    <Suspense>
      <TrackerView />
    </Suspense>
  );
}
