import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GemList from "@/components/GemList";

describe("GemList", () => {
  it("보석이 없으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<GemList gems={{ Gems: [], Skills: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("레벨, 종류, 적용 스킬을 표시한다", () => {
    render(
      <GemList
        gems={{
          Gems: [{ Slot: 0, Name: "<FONT>10레벨 겁화의 보석</FONT>", Level: 10 }],
          Skills: [{ GemSlot: 0, Name: "체인 소드" }],
        }}
      />,
    );
    expect(screen.getByText("Lv.10")).toBeInTheDocument();
    expect(screen.getByText("피해")).toBeInTheDocument();
    expect(screen.getByText("체인 소드")).toBeInTheDocument();
  });
});
