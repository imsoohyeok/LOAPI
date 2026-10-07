import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RosterTable from "@/components/RosterTable";
import { groupRosterByServer } from "@/lib/roster";
import type { ProfileState } from "@/lib/useRosterProfiles";

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

  it("전투력은 받은 캐릭터만 채우고, 나머지는 불러오는 중·실패로 표시한다", () => {
    const profiles = new Map<string, ProfileState>([
      [
        "본캐",
        {
          status: "success",
          profile: {
            CharacterName: "본캐",
            ServerName: "루페온",
            CharacterClassName: "바드",
            ItemAvgLevel: "1,680.00",
            CombatPower: "2,345.67",
          },
        },
      ],
      ["부캐", { status: "error", message: "요청 한도를 초과했습니다." }],
    ]);
    render(<RosterTable groups={groups} highlightName={null} profiles={profiles} />);

    // 서버마다 표가 따로라서 서버 수만큼 전투력 열 머리글이 있습니다.
    expect(
      screen.getAllByRole("columnheader", { name: "전투력", hidden: true }),
    ).toHaveLength(2);
    expect(screen.getByText("2,345.67")).toBeInTheDocument();
    expect(screen.getByText(/불러오지 못함/)).toBeInTheDocument();
  });

  it("프로필 정보를 넘기지 않으면 전투력 열을 그리지 않는다", () => {
    render(<RosterTable groups={groups} highlightName={null} />);
    expect(screen.queryAllByText("전투력")).toHaveLength(0);
  });
});
