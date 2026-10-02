import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RosterTable from "@/components/RosterTable";
import { groupRosterByServer } from "@/lib/roster";

const groups = groupRosterByServer([
  {
    ServerName: "루페온",
    CharacterName: "본캐",
    CharacterLevel: 70,
    CharacterClassName: "바드",
    ItemAvgLevel: "1,680.00",
  },
  {
    ServerName: "카제로스",
    CharacterName: "부캐",
    CharacterLevel: 60,
    CharacterClassName: "소서리스",
    ItemAvgLevel: "1,610.00",
  },
]);

describe("RosterTable", () => {
  it("서버별 섹션과 캐릭터를 렌더링한다", () => {
    render(<RosterTable groups={groups} highlightName={null} />);
    expect(screen.getByRole("region", { name: /루페온/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /카제로스/ })).toBeInTheDocument();
    expect(screen.getByText("소서리스")).toBeInTheDocument();
  });

  it("검색한 캐릭터 행을 aria-current로 표시한다", () => {
    render(<RosterTable groups={groups} highlightName="부캐" />);
    const row = screen.getByText("부캐").closest("tr");
    expect(row).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("본캐").closest("tr")).not.toHaveAttribute("aria-current");
  });
});
