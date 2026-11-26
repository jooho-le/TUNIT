import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auth from "./Auth";
import { ApiError } from "../../api/types";

const state = vi.hoisted(() => ({ signup: vi.fn(), login: vi.fn(), refresh: vi.fn() }));
vi.mock("../../api",async () => ({ api: { signup: state.signup, login: state.login }, apiMode: "http", ApiError: (await import("../../api/types")).ApiError }));
vi.mock("../../app/Session",() => ({ useSession: () => ({ refresh: state.refresh }) }));
beforeEach(() => { state.signup.mockReset().mockResolvedValue({ id: "user-1" }); state.login.mockReset(); });
async function form() {
  const user = userEvent.setup(); render(<MemoryRouter><Auth /></MemoryRouter>);
  await user.click(screen.getByRole("button",{name:"회원가입"}));
  await user.type(screen.getByLabelText("닉네임"),"리스너");
  await user.type(screen.getByLabelText("이메일"),"listener@example.test");
  await user.type(screen.getByLabelText("비밀번호"),"test-only-password");
  await user.click(screen.getByRole("checkbox"));
  return user;
}
describe("HTTP signup and server validation UX", () => {
  it("shows a separate login step after signup and clears the password without auto-login", async () => {
    const user = await form(); await user.click(screen.getByRole("button",{name:/내 취향으로 시작하기/}));
    expect(await screen.findByRole("status")).toHaveTextContent("가입이 완료됐어요");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("");
    expect(screen.getByLabelText("이메일")).toHaveValue("listener@example.test");
    expect(state.login).not.toHaveBeenCalled();
  });
  it("shows server field errors, preserves non-secret inputs and focuses the failing field", async () => {
    state.signup.mockRejectedValue(new ApiError(400,"입력 오류","INVALID_INPUT",[{field:"email",message:"이메일을 확인해 주세요."}]));
    const user = await form(); await user.click(screen.getByRole("button",{name:/내 취향으로 시작하기/}));
    expect(await screen.findByRole("alert")).toHaveTextContent("이메일을 확인해 주세요.");
    await waitFor(() => expect(screen.getByLabelText("이메일")).toHaveFocus());
    expect(screen.getByLabelText("닉네임")).toHaveValue("리스너");
    expect(state.login).not.toHaveBeenCalled();
  });
});
