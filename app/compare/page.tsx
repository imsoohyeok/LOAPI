import { Suspense } from "react";
import CompareView from "./CompareView";

export default function ComparePage() {
  // CompareView는 useSearchParams로 URL을 읽습니다. 정적으로 미리 렌더링하는 페이지에서는
  // 쿼리를 빌드 시점에 알 수 없으므로 Suspense 경계가 있어야 빌드가 됩니다.
  return (
    <Suspense>
      <CompareView />
    </Suspense>
  );
}
