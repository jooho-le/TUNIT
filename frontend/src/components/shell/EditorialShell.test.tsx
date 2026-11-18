import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../../app/App";
import { api } from "../../api";
import { validTaste } from "../../test/helpers";

describe("editorial navigation and keyboard access", () => {
  it("traps menu focus, closes on Escape, and restores scrolling and trigger focus", async () => {
    document.body.style.overflow = "clip";
    const user = userEvent.setup();
    const view = render(<App />);
    const trigger = screen.getByRole("button", { name: "메뉴 열기" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "전체 메뉴" });
    const close = within(dialog).getByRole("button", { name: "메뉴 닫기" });
    const links = within(dialog).getAllByRole("link");
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.getElementById("main-content")).toHaveAttribute("inert");
    await user.tab({ shift: true });
    expect(links[links.length - 1]).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("clip");
    expect(document.getElementById("main-content")).not.toHaveAttribute(
      "inert",
    );
    view.unmount();
    document.body.style.overflow = "";
  });

  it("closes the menu on navigation and keeps private routes protected", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: /Music twin/,
      }),
    );
    expect(await screen.findByLabelText("이메일")).toBeVisible();
    expect(window.location.hash).toBe("#/login");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("uses the persistent reel for the four signed-in sections", async () => {
    await api.signup({
      email: "reel@example.com",
      nickname: "릴리스너",
      password: "demo-password-123",
    });
    await api.saveTaste(validTaste());
    window.history.replaceState(null, "", "/#/home");
    const user = userEvent.setup();
    render(<App />);
    const reel = await screen.findByRole("navigation", {
      name: "하단 내비게이션",
    });
    expect(within(reel).getAllByRole("link")).toHaveLength(4);
    expect(within(reel).getByRole("link", { name: /HOME/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await user.click(within(reel).getByRole("link", { name: /MY TASTE/ }));
    expect(await screen.findByRole("switch")).toBeVisible();
    expect(window.location.hash).toBe("#/my");
    expect(
      within(reel).getByRole("link", { name: /MY TASTE/ }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("lets a chapter click skip the intro and scroll without changing the route hash", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: scroll,
      configurable: true,
    });
    render(<App />);
    expect(
      screen.getByRole("button", { name: /인트로 건너뛰기/ }),
    ).toBeVisible();
    const reel = screen.getByRole("navigation", { name: "랜딩 챕터" });
    fireEvent.click(within(reel).getByRole("link", { name: /MUSIC TWIN/ }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /인트로 건너뛰기/ }),
      ).not.toBeInTheDocument(),
    );
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(window.location.hash).toBe("#/landing");
  });
});
