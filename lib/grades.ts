export type ItemGrade =
  "일반" | "고급" | "희귀" | "영웅" | "전설" | "유물" | "고대" | "에스더";

interface GradeStyle {
  color: string; // 텍스트/포인트 색상
  border: string; // 카드 테두리 색상
  bg: string; // 은은한 배경색 (텍스트 위에 깔리는 정도)
}

const GRADE_STYLES: Record<ItemGrade, GradeStyle> = {
  일반: { color: "#c9ccd1", border: "#4b4f58", bg: "rgba(201,204,209,0.08)" },
  고급: { color: "#4ade80", border: "#2f6b45", bg: "rgba(74,222,128,0.08)" },
  희귀: { color: "#60a5fa", border: "#2d5490", bg: "rgba(96,165,250,0.08)" },
  영웅: { color: "#c084fc", border: "#6b3d94", bg: "rgba(192,132,252,0.08)" },
  전설: { color: "#fbbf24", border: "#8a6412", bg: "rgba(251,191,36,0.08)" },
  유물: { color: "#f97316", border: "#8a3d0f", bg: "rgba(249,115,22,0.08)" },
  고대: { color: "#e9d8a6", border: "#8a7c4f", bg: "rgba(233,216,166,0.1)" },
  에스더: { color: "#22d3ee", border: "#146675", bg: "rgba(34,211,238,0.08)" },
};

const DEFAULT_STYLE: GradeStyle = GRADE_STYLES["일반"];

export function getGradeStyle(grade: string | null | undefined): GradeStyle {
  if (!grade) return DEFAULT_STYLE;
  return GRADE_STYLES[grade as ItemGrade] ?? DEFAULT_STYLE;
}

export function isKnownGrade(grade: string | null | undefined): grade is ItemGrade {
  return !!grade && grade in GRADE_STYLES;
}
