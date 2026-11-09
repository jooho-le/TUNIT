import { INTRO_SEEN_KEY } from "./content";

export function shouldPlayIntro() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== "seen";
  } catch {
    return true;
  }
}

/** CSS owns animation; this observer only pauses loops offscreen/in background tabs. */
export function attachLandingMotion(root: HTMLElement) {
  const scenes = root.querySelectorAll<HTMLElement>("[data-loop-scene]");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let observer: IntersectionObserver | null = null;
  const visibility = () => {
    root.dataset.motionPaused = String(document.hidden);
  };
  const configure = () => {
    observer?.disconnect();
    observer = null;
    scenes.forEach((scene) => {
      scene.dataset.motionActive = "false";
    });
    if (preference.matches) return;
    if (!("IntersectionObserver" in window)) {
      scenes.forEach((scene) => {
        scene.dataset.motionActive = "true";
      });
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          (entry.target as HTMLElement).dataset.motionActive = String(
            entry.isIntersecting,
          );
      },
      { rootMargin: "80px" },
    );
    scenes.forEach((scene) => observer!.observe(scene));
  };
  configure();
  visibility();
  preference.addEventListener("change", configure);
  document.addEventListener("visibilitychange", visibility);
  return () => {
    observer?.disconnect();
    preference.removeEventListener("change", configure);
    document.removeEventListener("visibilitychange", visibility);
    scenes.forEach((scene) => {
      delete scene.dataset.motionActive;
    });
    delete root.dataset.motionPaused;
  };
}
