import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Connections } from "./Interests";

const state = vi.hoisted(() => ({ rows: [] as { id: string; partner: { id: string; nickname: string } }[], read: vi.fn(), remove: vi.fn() }));
vi.mock("../../api",async () => ({ api: { connections: state.read, disconnect: state.remove }, apiMode: "http", ApiError: (await import("../../api/types")).ApiError }));
beforeEach(() => {
  state.rows = [{ id: "connection-1", partner: { id: "user-2", nickname: "친구" } }];
  state.read.mockReset().mockImplementation(async () => [...state.rows]);
  state.remove.mockReset().mockImplementation(async () => { state.rows = []; });
});
const open = () => render(<MemoryRouter><Connections /></MemoryRouter>);
describe("connection removal confirmation and uncertain responses", () => {
  it("requires confirmation, initially focuses cancel, and Escape leaves the relationship intact", async () => {
    const user = userEvent.setup(); open();
    await user.click(await screen.findByRole("button",{name:"연결 해제"}));
    expect(screen.getByRole("alertdialog",{name:"친구 연결 해제 확인"})).toBeVisible();
    expect(screen.getByRole("button",{name:"돌아가기"})).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(); expect(state.remove).not.toHaveBeenCalled();
  });
  it("removes the displayed connection only after the confirmed request completes", async () => {
    const user = userEvent.setup(); open();
    await user.click(await screen.findByRole("button",{name:"연결 해제"}));
    await user.click(screen.getByRole("button",{name:"연결 해제 확인"}));
    expect(await screen.findByRole("heading",{name:"아직 함께 듣는 사람이 없어요."})).toBeVisible();
    expect(state.remove).toHaveBeenCalledExactlyOnceWith("connection-1");
  });
  it("re-reads server state after a lost response without sending a second DELETE", async () => {
    state.remove.mockImplementation(async () => { state.rows = []; throw new Error("응답 연결 끊김"); });
    const user = userEvent.setup(); open();
    await user.click(await screen.findByRole("button",{name:"연결 해제"}));
    await user.click(screen.getByRole("button",{name:"연결 해제 확인"}));
    expect(await screen.findByRole("heading",{name:"아직 함께 듣는 사람이 없어요."})).toBeVisible();
    expect(state.remove).toHaveBeenCalledTimes(1); expect(state.read.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
  it("keeps the existing friend and shows failure when the server still has the relationship", async () => {
    state.remove.mockRejectedValue(new Error("연결 해제 실패"));
    const user = userEvent.setup(); open();
    await user.click(await screen.findByRole("button",{name:"연결 해제"}));
    await user.click(screen.getByRole("button",{name:"연결 해제 확인"}));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("연결 해제 실패"));
    expect(screen.getByRole("heading",{name:"친구"})).toBeVisible();
    expect(screen.getByRole("button",{name:"연결 해제 확인"})).toBeEnabled();
  });
});
