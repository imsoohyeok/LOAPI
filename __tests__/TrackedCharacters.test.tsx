import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TrackedCharacters from "@/components/TrackedCharacters";

describe("TrackedCharacters", () => {
  beforeEach(() => window.localStorage.clear());

  it("기록이 없으면 트래커로 안내한다", async () => {
    render(<TrackedCharacters />);
    expect(await screen.findByText(/아직 기록한 캐릭터가 없어요/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "성장 트래커" })).toHaveAttribute(
      "href",
      "/tracker",
    );
  });

  it("최근 기록 순으로 이름, 아이템레벨, 기록 수를 보여준다", async () => {
    window.localStorage.setItem(
      "lostark-tracker:바드",
      JSON.stringify([
        { date: "2026-10-01", itemLevel: 1675 },
        { date: "2026-10-03", itemLevel: 1680.5 },
      ]),
    );
    window.localStorage.setItem(
      "lostark-tracker:소서리스",
      JSON.stringify([{ date: "2026-10-05", itemLevel: 1700 }]),
    );

    render(<TrackedCharacters />);
    const items = await screen.findAllByRole("listitem");
    expect(items.map((li) => li.querySelector("p")?.textContent)).toEqual([
      "소서리스",
      "바드",
    ]);
    expect(screen.getByText("1,680.50")).toBeInTheDocument();
    expect(screen.getByText("2026-10-03 기록 · 총 2회")).toBeInTheDocument();
  });
});
