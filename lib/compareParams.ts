// 비교 페이지의 두 캐릭터는 URL 쿼리(?a=캐릭터1&b=캐릭터2)에 저장합니다.
// URL이 유일한 원본이라서 링크를 공유하거나 새로고침·뒤로가기를 해도 같은 비교가 보입니다.
export type CompareSide = "a" | "b";

export interface CompareNames {
  a: string | null;
  b: string | null;
}

// 손으로 고친 링크처럼 공백만 있거나 빈 값은 "선택 안 함"으로 봅니다.
function normalize(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readCompareNames(params: Pick<URLSearchParams, "get">): CompareNames {
  return { a: normalize(params.get("a")), b: normalize(params.get("b")) };
}

// 다른 쿼리 파라미터(utm 등)는 그대로 두고 해당 쪽 이름만 바꾼 쿼리 문자열을 만듭니다.
export function withCompareName(
  params: URLSearchParams,
  side: CompareSide,
  name: string,
): string {
  const next = new URLSearchParams(params);
  const value = normalize(name);
  if (value) next.set(side, value);
  else next.delete(side);
  return next.toString();
}

export function compareTitle({ a, b }: CompareNames): string | null {
  if (a && b) return `${a} vs ${b}`;
  return a ?? b;
}
