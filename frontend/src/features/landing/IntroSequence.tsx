import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";
import { INTRO_DURATION, SPLASH_SHOTS, type SplashShot } from "./content";
import SplashScenes from "./SplashScenes";

export default function IntroSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const [shot, setShot] = useState<SplashShot>("taste");
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus({ preventScroll: true });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (preference.matches) onComplete();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onComplete();
    };
    const timer = window.setTimeout(onComplete, INTRO_DURATION);
    const cuts = SPLASH_SHOTS.slice(1).map((next) =>
      window.setTimeout(() => setShot(next.id), INTRO_DURATION * next.at),
    );
    preference.addEventListener("change", reduce);
    window.addEventListener("keydown", escape);
    reduce();
    return () => {
      window.clearTimeout(timer);
      cuts.forEach((cut) => window.clearTimeout(cut));
      preference.removeEventListener("change", reduce);
      window.removeEventListener("keydown", escape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete]);
  return (
    <section
      ref={root}
      tabIndex={-1}
      className="landing-intro app-splash"
      data-screen="S01-A"
      data-phase={shot}
      aria-label="TUNIT 스플래시"
      style={{ "--intro-duration": `${INTRO_DURATION}ms` } as CSSProperties}
    >
      <div className="splash-topline">
        <span>TUNIT <small>MUSIC CONNECTS US.</small></span>
        <button className="splash-skip" onClick={onComplete}>
          스플래시 건너뛰기 <Icon name="arrow" size={18} />
        </button>
      </div>
      <h1 className="splash-accessible-title">TUNIT 스플래시</h1>
      <SplashScenes active={shot} />
      <div className="splash-bottom">
        <span>SAME SOUND.<br />NEW CONNECTION.</span>
        <Link className="splash-start" to="/start" onClick={onComplete}>
          내 취향 찾기 <Icon name="arrow" size={20} />
        </Link>
      </div>
      <div className="splash-track" aria-hidden="true"><span /></div>
    </section>
  );
}
