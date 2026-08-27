export function parseItemLevel(itemAvgLevel: string): number {
  const num = parseFloat(itemAvgLevel.replace(/,/g, ""));
  return Number.isNaN(num) ? 0 : num;
}
