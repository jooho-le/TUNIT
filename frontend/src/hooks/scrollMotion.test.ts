import { afterEach, describe, expect, it, vi } from "vitest";
import { attachScrollMotion } from "./scrollMotion";
import { attachLandingMotion } from "../features/landing/motion";

afterEach(() => vi.unstubAllGlobals());
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
describe("landing motion lifecycle", () => {
  it("includes scenes mounted after async loading and removes scroll work on cleanup", async () => {
    motionEnabled();
    let frame: FrameRequestCallback | undefined;
    let intersect: IntersectionObserverCallback | undefined;
    const disconnect = vi.fn(),
      unobserve = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersect = callback;
        }
        observe() {}
        unobserve = unobserve;
        disconnect = disconnect;
      },
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 42;
    });
    const cancel = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});
    const root = document.createElement("main");
    document.body.append(root);
    const cleanup = attachScrollMotion(root);
    const scene = document.createElement("section");
    scene.dataset.scrollScene = "";
    const title = document.createElement("h2");
    title.dataset.reveal = "";
    scene.append(title);
    scene.getBoundingClientRect = () => ({
      top: 100,
      height: 400,
      bottom: 500,
      left: 0,
      right: 400,
      width: 400,
      x: 0,
      y: 100,
      toJSON() {},
    });
    root.append(scene);
    await new Promise((resolve) => queueMicrotask(() => resolve(null)));
    frame?.(0);
    expect(
      Number(scene.style.getPropertyValue("--scene-progress")),
    ).toBeGreaterThan(0);
    expect(title.dataset.revealState).toBe("waiting");
    intersect?.(
      [
        {
          target: title,
          isIntersecting: true,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(title.dataset.revealState).toBe("shown");
    window.dispatchEvent(new Event("scroll"));
    cleanup();
    expect(cancel).toHaveBeenCalledWith(42);
    expect(disconnect).toHaveBeenCalled();
    expect(scene.style.getPropertyValue("--scene-progress")).toBe("");
    expect(title.dataset.revealState).toBeUndefined();
    root.remove();
  });

  it("pauses decorative loops when outside the viewport and disconnects when leaving", () => {
    motionEnabled();
    let intersect: IntersectionObserverCallback | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersect = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const root = document.createElement("div"),
      scene = document.createElement("section");
    scene.dataset.loopScene = "";
    root.append(scene);
    const cleanup = attachLandingMotion(root);
    expect(scene.dataset.motionActive).toBe("false");
    intersect?.(
      [
        {
          target: scene,
          isIntersecting: true,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(scene.dataset.motionActive).toBe("true");
    intersect?.(
      [
        {
          target: scene,
          isIntersecting: false,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(scene.dataset.motionActive).toBe("false");
    cleanup();
    expect(disconnect).toHaveBeenCalled();
    expect(scene.dataset.motionActive).toBeUndefined();
  });
});
