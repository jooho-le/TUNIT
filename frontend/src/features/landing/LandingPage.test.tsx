import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../../app/App";
import { api } from "../../api";
import { validTaste } from "../../test/helpers";
import LandingPage from "./LandingPage";
import { INTRO_DURATION, INTRO_SEEN_KEY } from "./content";

function motionEnabled() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}
function page() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}
afterEach(() => {
  vi.useRealTimers();
});

describe("S01 independent animated landing", () => {
  it("shows all four stories and the start CTA with reduced motion, without an intro wait", () => {
    page();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "취향이 맞는사람을 발견하다.",
    );
    for (const title of [
      /좋아하는 음악이/,
      /나와 닮은 플레이리스트/,
      /나의 다음 곡으로/,
      /몰랐던 취향/,
    ])
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByRole("link", { name: /지금 시작하기/ })).toHaveAttribute(
      "href",
      "/start",
    );
    expect(
      screen.queryByRole("button", { name: /인트로 건너뛰기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/화면 미리보기/)).toHaveLength(4);
  });

  it("can skip the intro immediately, restores keyboard focus, and remembers only that preference", () => {
    motionEnabled();
    const view = page();
    const skip = screen.getByRole("button", { name: /인트로 건너뛰기/ });
    skip.focus();
    fireEvent.click(skip);
    expect(
      screen.queryByRole("button", { name: /인트로 건너뛰기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /내 취향 찾기/ })).toHaveFocus();
    expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBe("seen");
    expect(localStorage.length).toBe(0);
    view.unmount();
    page();
    expect(
      screen.queryByRole("button", { name: /인트로 건너뛰기/ }),
    ).not.toBeInTheDocument();
  });

  it("finishes automatically after the short sequence and cancels its timer when unmounted", () => {
    motionEnabled();
    vi.useFakeTimers();
    const view = page();
    expect(
      screen.getByRole("button", { name: /인트로 건너뛰기/ }),
    ).toBeEnabled();
    act(() => {
      vi.advanceTimersByTime(INTRO_DURATION);
    });
    expect(
      screen.queryByRole("button", { name: /인트로 건너뛰기/ }),
    ).not.toBeInTheDocument();
    view.unmount();
    sessionStorage.removeItem(INTRO_SEEN_KEY);
    const second = page();
    second.unmount();
    act(() => {
      vi.advanceTimersByTime(INTRO_DURATION);
    });
    expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBeNull();
  });

  it("keeps the landing and its CTA available while the session request is pending", async () => {
    vi.spyOn(api, "me").mockReturnValue(new Promise(() => {}));
    window.history.replaceState(null, "", "/#/");
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "취향이 맞는",
    );
    expect(screen.getByRole("link", { name: "시작하기" })).toHaveAttribute(
      "href",
      "#/start",
    );
    expect(
      screen.queryByRole("navigation", { name: "메인 메뉴" }),
    ).not.toBeInTheDocument();
  });

  it("lets a visitor leave for login before the intro finishes", async () => {
    motionEnabled();
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByRole("button", { name: /인트로 건너뛰기/ }),
    ).toBeVisible();
    await user.click(screen.getByRole("link", { name: /내 취향 찾기/ }));
    expect(await screen.findByLabelText("이메일")).toBeVisible();
    expect(window.location.hash).toBe("#/login");
    expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBeNull();
  });

  it.each([false, true])(
    "keeps the landing visible for a signed-in user, then routes according to taste readiness (%s)",
    async (complete) => {
      await api.signup({
        email: "listener@example.com",
        nickname: "리스너",
        password: "demo-password-123",
      });
      if (complete) await api.saveTaste(validTaste());
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() =>
        expect(screen.getByRole("link", { name: "내 취향" })).toBeVisible(),
      );
      expect(window.location.hash).toBe("#/landing");
      expect(
        screen.queryByRole("navigation", { name: "하단 내비게이션" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("link", { name: /지금 시작하기/ }));
      await waitFor(() =>
        expect(window.location.hash).toBe(
          complete ? "#/home" : "#/onboarding/intro",
        ),
      );
      expect(
        await screen.findByRole("heading", { level: 1 }),
      ).toHaveTextContent(complete ? "리스너님의 지금" : "당신의 취향에");
    },
  );

  it("scrolls within the landing without replacing the router hash", () => {
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: scroll,
      configurable: true,
    });
    page();
    fireEvent.click(screen.getByRole("link", { name: /먼저 둘러볼게요/ }));
    expect(scroll).toHaveBeenCalledWith({
      behavior: "instant",
      block: "start",
    });
    expect(window.location.hash).toBe("#/landing");
  });
});
