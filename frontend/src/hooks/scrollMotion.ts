const revealSelector = [
  "[data-reveal]",
  ".page-greeting",
  ".selection-heading",
  ".focused-view > h1",
  ".artist-card",
  ".person-card",
  ".taste-id",
  ".taste-details",
  ".profile-art",
  ".profile-info",
  ".venn-section",
  ".music-feature",
  ".music-list-row",
].join(",");

/** Observe content and update scroll transforms only when scrolling or resizing. */
export function attachScrollMotion(root: HTMLElement): () => void {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let release = () => {};

  const configure = () => {
    release();
    if (preference.matches || !("IntersectionObserver" in window)) return;

    const observed = new Set<HTMLElement>();
    const scenes = new Set<HTMLElement>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      for (const scene of scenes) {
        const rect = scene.getBoundingClientRect();
        if (!rect.height) continue;
        const progress = Math.max(
          0,
          Math.min(1, (viewport - rect.top) / (viewport + rect.height)),
        );
        const exit = Math.max(0, Math.min(1, -rect.top / rect.height));
        scene.style.setProperty("--scene-progress", progress.toFixed(4));
        scene.style.setProperty("--scroll-out", exit.toFixed(4));
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.dataset.revealState = "shown";
          observer.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );

    const register = () => {
      // Route content can mount after the async session check.
      root
        .querySelectorAll<HTMLElement>("[data-scroll-scene]")
        .forEach((scene) => scenes.add(scene));
      scenes.forEach((scene) => {
        if (!root.contains(scene)) scenes.delete(scene);
      });
      root.querySelectorAll<HTMLElement>(revealSelector).forEach((target) => {
        if (observed.has(target)) return;
        observed.add(target);
        // Visible content should never be hidden while using the keyboard.
        if (target.contains(document.activeElement)) {
          target.dataset.revealState = "shown";
          return;
        }
        target.dataset.revealState = "waiting";
        observer.observe(target);
      });
      schedule();
    };

    const mutations = new MutationObserver(register);
    register();
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    release = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      mutations.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      observed.forEach((target) => {
        delete target.dataset.revealState;
      });
      scenes.forEach((scene) => {
        scene.style.removeProperty("--scene-progress");
        scene.style.removeProperty("--scroll-out");
      });
      release = () => {};
    };
  };

  configure();
  preference.addEventListener("change", configure);
  return () => {
    release();
    preference.removeEventListener("change", configure);
  };
}
