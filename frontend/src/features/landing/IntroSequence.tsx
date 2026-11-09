import { useEffect, useRef } from "react";
import { Icon } from "../../components/ui";
import { INTRO_DURATION } from "./content";

export default function IntroSequence({
  onComplete,
}: {
  onComplete: (restoreFocus?: boolean) => void;
}) {
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const finish = () => onComplete(document.activeElement === skip.current);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (preference.matches) finish();
    };
    const timer = window.setTimeout(finish, INTRO_DURATION);
    preference.addEventListener("change", reduce);
    return () => {
      window.clearTimeout(timer);
      preference.removeEventListener("change", reduce);
    };
  }, [onComplete]);
  return (
    <div
      className="landing-intro"
      data-screen="S01-A"
      aria-label="TUNIT 브랜드 인트로"
    >
      <div className="landing-intro-orbits" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="landing-intro-word" aria-hidden="true">
        {"TUNIT.".split("").map((letter, i) => (
          <span key={i} style={{ animationDelay: `${i * 80}ms` }}>
            {letter}
          </span>
        ))}
      </div>
      <span className="landing-intro-caption">
        EVERY CONNECTION STARTS WITH A SOUND.
      </span>
      <button
        ref={skip}
        className="landing-skip"
        onClick={() => onComplete(true)}
      >
        인트로 건너뛰기 <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}
