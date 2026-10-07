import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import CacheBadge from "@/components/CacheBadge";

const MINUTE = 60_000;
const NOW = new Date("2026-10-07T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CacheBadge", () => {
  it("캐시 출처와 경과 시간을 보여준다", () => {
    render(<CacheBadge info={{ fromCache: true, fetchedAt: NOW - 2 * MINUTE }} />);
    expect(screen.getByText("저장된 정보")).toBeInTheDocument();
    expect(screen.getByText("2분 전")).toHaveAttribute(
      "dateTime",
      new Date(NOW - 2 * MINUTE).toISOString(),
    );
  });

  it("화면에 머무는 동안 경과 시간이 갱신된다", () => {
    render(<CacheBadge info={{ fromCache: false, fetchedAt: NOW }} />);
    expect(screen.getByText("방금")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(MINUTE);
    });
    expect(screen.getByText("1분 전")).toBeInTheDocument();
  });

  it("캐시 정보가 없으면 아무것도 그리지 않는다", () => {
    const { container } = render(<CacheBadge info={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
