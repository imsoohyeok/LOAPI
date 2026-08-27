import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CharacterCard from "@/components/CharacterCard";
import type { Profile } from "@/lib/types";

const mockProfile: Profile = {
  CharacterName: "테스트캐릭터",
  ServerName: "루페온",
  CharacterClassName: "디스트로이어",
  ItemAvgLevel: "1680.00",
};

describe("CharacterCard", () => {
  it("캐릭터 이름을 표시한다", () => {
    render(<CharacterCard profile={mockProfile} />);
    expect(screen.getByText("테스트캐릭터")).toBeInTheDocument();
  });

  it("서버명과 직업명을 표시한다", () => {
    render(<CharacterCard profile={mockProfile} />);
    expect(screen.getByText(/루페온/)).toBeInTheDocument();
    expect(screen.getByText(/디스트로이어/)).toBeInTheDocument();
  });

  it("아이템 레벨을 표시한다", () => {
    render(<CharacterCard profile={mockProfile} />);
    expect(screen.getByText(/1680.00/)).toBeInTheDocument();
  });
});
