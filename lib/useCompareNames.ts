"use client";

import { useSearchParams } from "next/navigation";
import {
  readCompareNames,
  withCompareName,
  type CompareNames,
  type CompareSide,
} from "@/lib/compareParams";

export function useCompareNames(): CompareNames & {
  setName: (side: CompareSide, name: string) => void;
} {
  const searchParams = useSearchParams();

  function setName(side: CompareSide, name: string) {
    // 지금 URL에서 다시 읽어서, 두 쪽을 연달아 바꿔도 앞의 변경이 사라지지 않게 합니다.
    const query = withCompareName(
      new URLSearchParams(window.location.search),
      side,
      name,
    );
    // Next 14.1부터 history.pushState가 useSearchParams와 동기화됩니다.
    // router.push와 달리 서버에 RSC 페이로드를 다시 요청하지 않고 URL만 바꾸며,
    // push라서 뒤로가기를 누르면 이전 비교로 돌아갑니다.
    window.history.pushState(null, "", `${window.location.pathname}?${query}`);
  }

  return { ...readCompareNames(searchParams), setName };
}
