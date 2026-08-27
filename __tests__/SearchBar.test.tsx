import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/SearchBar";

describe("SearchBar", () => {
  it("입력 후 제출하면 onSearch가 트리밍된 값과 함께 호출된다", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);

    const input = screen.getByPlaceholderText("캐릭터명을 입력하세요");
    await user.type(input, "  홍길동  ");
    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearch).toHaveBeenCalledWith("홍길동");
  });

  it("빈 값으로는 onSearch가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);

    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("loading이 true면 버튼이 비활성화되고 텍스트가 바뀐다", () => {
    render(<SearchBar onSearch={vi.fn()} loading={true} />);
    const button = screen.getByRole("button", { name: "검색 중..." });
    expect(button).toBeDisabled();
  });
});
