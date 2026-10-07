// 상단 내비게이션과 홈 화면 카드가 같은 목록을 씁니다. 페이지를 추가할 때 여기 한 곳만 고치면 됩니다.
export interface Feature {
  href: string;
  label: string;
  description: string;
}

export const FEATURES: readonly Feature[] = [
  {
    href: "/compare",
    label: "캐릭터 비교",
    description: "두 캐릭터의 아이템레벨과 장비를 나란히 놓고 차이를 확인해요.",
  },
  {
    href: "/tracker",
    label: "성장 트래커",
    description: "아이템레벨을 날짜별로 기록하고 성장 추이를 차트로 봐요.",
  },
  {
    href: "/expedition",
    label: "원정대",
    description: "캐릭터 하나로 같은 원정대의 모든 캐릭터를 서버별로 모아 봐요.",
  },
  {
    href: "/market",
    label: "거래소",
    description: "강화 재료·각인서 같은 거래소 아이템의 현재 최저가를 검색해요.",
  },
];
