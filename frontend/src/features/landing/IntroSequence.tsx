import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";
import { INTRO_DURATION } from "./content";

export default function IntroSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const root = useRef<HTMLElement>(null);
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
    preference.addEventListener("change", reduce);
    window.addEventListener("keydown", escape);
    reduce();
    return () => {
      window.clearTimeout(timer);
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
      aria-label="TUNIT 스플래시"
      style={{ "--intro-duration": `${INTRO_DURATION}ms` } as CSSProperties}
    >
      <div className="splash-topline">
        <span>TUNIT <small>MUSIC CONNECTS US.</small></span>
        <button className="splash-skip" onClick={onComplete}>
          스플래시 건너뛰기 <Icon name="arrow" size={18} />
        </button>
      </div>
      <div className="splash-stage">
        <div className="splash-orbit" aria-hidden="true"><i /><i /><i /></div>
        <p className="splash-eyebrow">YOUR TASTE. YOUR PEOPLE.</p>
        <h1 className="splash-wordmark" aria-label="TUNIT 스플래시">
          {"Tunit.".split("").map((letter, i) => (
            <span aria-hidden="true" key={i} style={{ animationDelay: `${i * 80}ms` }}>
              {letter}
            </span>
          ))}
        </h1>
        <p className="splash-caption">취향이 닿는 순간, 튠잇.</p>
      </div>
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
