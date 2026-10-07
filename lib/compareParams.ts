import { normalizeQueryValue } from "@/lib/utils";

// 비교 페이지의 두 캐릭터는 URL 쿼리(?a=캐릭터1&b=캐릭터2)에 저장합니다.
// URL이 유일한 원본이라서 링크를 공유하거나 새로고침·뒤로가기를 해도 같은 비교가 보입니다.
export type CompareSide = "a" | "b";

export interface CompareNames {
  a: string | null;
  b: string | null;
}

export function readCompareNames(params: Pick<URLSearchParams, "get">): CompareNames {
  return {
    a: normalizeQueryValue(params.get("a")),
    b: normalizeQueryValue(params.get("b")),
  };
}

// 다른 쿼리 파라미터(utm 등)는 그대로 두고 해당 쪽 이름만 바꾼 쿼리 문자열을 만듭니다.
export function withCompareName(
  params: URLSearchParams,
  side: CompareSide,
  name: string,
): string {
  const next = new URLSearchParams(params);
  const value = normalizeQueryValue(name);
  if (value) next.set(side, value);
  else next.delete(side);
  return next.toString();
}

export function compareTitle({ a, b }: CompareNames): string | null {
  if (a && b) return `${a} vs ${b}`;
  return a ?? b;
}
