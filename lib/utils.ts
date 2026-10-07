export function parseItemLevel(itemAvgLevel: string): number {
  const num = parseFloat(itemAvgLevel.replace(/,/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

// 비교/장비 목록 화면에서 굳이 보여줄 필요 없는 장비 타입 (나침반, 부적, 보주 등 부가 아이템)
const EXCLUDED_EQUIPMENT_TYPES = new Set(["나침반", "부적", "문장", "보주"]);

export function filterDisplayEquipment<T extends { Type: string }>(equipment: T[]): T[] {
  return equipment.filter((item) => !EXCLUDED_EQUIPMENT_TYPES.has(item.Type));
}

// URL 쿼리로 받은 캐릭터 이름을 정리합니다. 손으로 고친 링크처럼 공백만 있거나 빈 값은 "선택 안 함"(null)입니다.
export function normalizeQueryValue(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
