// 트래커에서 보고 있는 캐릭터는 URL 쿼리(?name=캐릭터)에 저장합니다.
// 홈의 "최근 기록한 캐릭터"나 다른 페이지에서 링크로 바로 들어올 수 있고, 새로고침·뒤로가기에도 유지됩니다.
import { normalizeQueryValue } from "@/lib/utils";

export function readTrackerName(params: Pick<URLSearchParams, "get">): string | null {
  return normalizeQueryValue(params.get("name"));
}

// 다른 쿼리 파라미터는 유지하고 name만 바꾼 쿼리 문자열을 만듭니다.
export function withTrackerName(params: URLSearchParams, name: string): string {
  const next = new URLSearchParams(params);
  const value = normalizeQueryValue(name);
  if (value) next.set("name", value);
  else next.delete("name");
  return next.toString();
}

export function trackerHref(name: string): string {
  return `/tracker?${withTrackerName(new URLSearchParams(), name)}`;
}
