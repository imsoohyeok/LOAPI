import { getGradeStyle, type ItemGrade } from "@/lib/grades";

const GRADES: ItemGrade[] = [
  "일반",
  "고급",
  "희귀",
  "영웅",
  "전설",
  "유물",
  "고대",
  "에스더",
];

export default function GradeLegend() {
  return (
    <div className="mb-5 flex flex-wrap gap-3 text-xs text-gray-400">
      {GRADES.map((grade) => {
        const style = getGradeStyle(grade);
        return (
          <span key={grade} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: style.color }}
            />
            {grade}
          </span>
        );
      })}
    </div>
  );
}
