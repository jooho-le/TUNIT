import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "../../api/types";
import { InterestCompose } from "./Interests";

const state = vi.hoisted(() => ({ send: vi.fn(), read: vi.fn() }));
vi.mock("../../api", async () => ({
  ApiError: (await import("../../api/types")).ApiError, apiMode: "http",
  api: { match: async () => ({ user: { nickname: "친구" }, commonTracks: [] }), sendInterest: state.send, interests: state.read },
}));
beforeEach(() => { state.send.mockReset(); state.read.mockReset(); });
function open() {
  render(<MemoryRouter initialEntries={["/interest/user-2"]}><Routes>
    <Route path="/interest/:userId" element={<InterestCompose />} />
    <Route path="/interests/sent" element={<p>보낸 요청 확인</p>} />
  </Routes></MemoryRouter>);
}
it("checks committed requests after a lost response instead of posting twice", async () => {
  state.send.mockRejectedValue(new ApiError(0, "응답 연결 끊김"));
  state.read.mockResolvedValue([{ recipientId: "user-2", status: "PENDING" }]);
  const user = userEvent.setup(); open();
  await user.click(await screen.findByRole("button", { name: "관심 요청 보내기" }));
  expect(await screen.findByText("보낸 요청 확인")).toBeVisible();
  expect(state.send).toHaveBeenCalledExactlyOnceWith("user-2", "");
  expect(state.read).toHaveBeenCalledExactlyOnceWith("sent");
});
it("keeps the form and original failure when the server has no saved request", async () => {
  state.send.mockRejectedValue(new ApiError(500, "저장 실패"));
  state.read.mockResolvedValue([]);
  const user = userEvent.setup(); open();
  await user.click(await screen.findByRole("button", { name: "관심 요청 보내기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("저장 실패");
  expect(screen.getByRole("button", { name: "관심 요청 보내기" })).toBeEnabled();
  expect(state.send).toHaveBeenCalledTimes(1);
});
