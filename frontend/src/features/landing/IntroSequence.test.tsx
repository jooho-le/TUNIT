import { StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../app/App";
import { api } from "../../api";
import IntroSequence from "./IntroSequence";
import { INTRO_DURATION } from "./content";

function motionEnabled() {
  const preference = Object.assign(new EventTarget(), {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
  });
  vi.spyOn(window, "matchMedia").mockReturnValue(preference as MediaQueryList);
  return preference;
}
const splash = () => screen.queryByRole("region", { name: "TUNIT 스플래시" });
const snapshot = (storage: Storage) =>
  Object.fromEntries(Array.from({ length: storage.length }, (_, index) => {
    const key = storage.key(index)!;
    return [key, storage.getItem(key)];
  }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.style.overflow = "";
});

describe("three-second app splash", () => {
  it("shows the full-screen splash before the header, reel, and route content", () => {
    motionEnabled();
    document.body.style.overflow = "clip";
    const view = render(<App />);
    expect(splash()).toBeVisible();
    expect(splash()).toHaveClass("app-splash");
    expect(splash()).toHaveStyle({ "--intro-duration": "3000ms" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("TUNIT 스플래시");
    expect(screen.queryByRole("button", { name: "메뉴 열기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "랜딩 챕터" })).not.toBeInTheDocument();
    expect(document.getElementById("main-content")).toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("clip");
  });

  it("finishes at three seconds exactly once, including React StrictMode effect replay", () => {
    motionEnabled();
    vi.useFakeTimers();
    const complete = vi.fn();
    render(<StrictMode><MemoryRouter><IntroSequence onComplete={complete} /></MemoryRouter></StrictMode>);
    act(() => vi.advanceTimersByTime(2999));
    expect(complete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("opens the requested deep link after the timer without replacing its return URL", async () => {
    motionEnabled();
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#/login?next=%2Finvite%2Fexample-token");
    render(<App />);
    expect(splash()).toBeVisible();
    await act(async () => vi.advanceTimersByTime(INTRO_DURATION));
    expect(splash()).not.toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeVisible();
    expect(window.location.hash).toBe("#/login?next=%2Finvite%2Fexample-token");
    expect(document.body.style.overflow).toBe("");
    expect(document.getElementById("main-content")).toHaveFocus();
  });

  it("skips immediately, restores main focus, and preserves accounts and old intro preferences", async () => {
    motionEnabled();
    await api.signup({ email: "splash@example.test", nickname: "리스너", password: "demo-password-123" });
    sessionStorage.setItem("tunit-brand-intro-v1", "seen");
    sessionStorage.setItem("tunit-brand-intro-v2", "seen");
    const localBefore = snapshot(localStorage), sessionBefore = snapshot(sessionStorage);
    render(<App />);
    const skip = screen.getByRole("button", { name: /스플래시 건너뛰기/ });
    skip.focus();
    fireEvent.click(skip);
    expect(splash()).not.toBeInTheDocument();
    expect(document.getElementById("main-content")).toHaveFocus();
    expect(snapshot(localStorage)).toEqual(localBefore);
    expect(snapshot(sessionStorage)).toEqual(sessionBefore);
  });

  it("does not repeat on internal navigation and plays again on a fresh app mount", async () => {
    motionEnabled();
    const view = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /스플래시 건너뛰기/ }));
    await act(async () => { window.location.hash = "/login"; });
    expect(await screen.findByLabelText("이메일")).toBeVisible();
    expect(splash()).not.toBeInTheDocument();
    view.unmount();
    render(<App />);
    expect(splash()).toBeVisible();
    expect(window.location.hash).toBe("#/login");
  });

  it("allows starting before the timer and keeps the normal login routing", async () => {
    motionEnabled();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /내 취향 찾기/ }));
    expect(await screen.findByLabelText("이메일")).toBeVisible();
    expect(window.location.hash).toBe("#/login");
    expect(splash()).not.toBeInTheDocument();
  });

  it("respects reduced motion on entry without waiting three seconds", () => {
    render(<App />);
    expect(splash()).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("TUNIT — 취향이 맞는 사람을 발견하다");
  });

  it("finishes when reduced motion is enabled during playback", () => {
    const preference = motionEnabled();
    render(<App />);
    expect(splash()).toBeVisible();
    act(() => { preference.matches = true; preference.dispatchEvent(new Event("change")); });
    expect(splash()).not.toBeInTheDocument();
    expect(document.getElementById("main-content")).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("supports Escape as an immediate keyboard skip", () => {
    motionEnabled();
    render(<App />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(splash()).not.toBeInTheDocument();
    expect(document.getElementById("main-content")).toHaveFocus();
  });

  it("cleans up its timeout and keyboard listener when unmounted", () => {
    motionEnabled();
    vi.useFakeTimers();
    const complete = vi.fn();
    const view = render(<MemoryRouter><IntroSequence onComplete={complete} /></MemoryRouter>);
    view.unmount();
    act(() => vi.advanceTimersByTime(INTRO_DURATION));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(complete).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });
});
