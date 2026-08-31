export function parseItemLevel(itemAvgLevel: string): number {
  const num = parseFloat(itemAvgLevel.replace(/,/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

// 비교/장비 목록 화면에서 굳이 보여줄 필요 없는 장비 타입 (나침반, 부적, 보주 등 부가 아이템)
const EXCLUDED_EQUIPMENT_TYPES = new Set(["나침반", "부적", "문장", "보주"]);

export function filterDisplayEquipment<T extends { Type: string }>(equipment: T[]): T[] {
  return equipment.filter((item) => !EXCLUDED_EQUIPMENT_TYPES.has(item.Type));
}
