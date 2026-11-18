import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";
import { INTRO_DURATION } from "./content";

export default function IntroSequence({
  onComplete,
}: {
  onComplete: (restoreFocus?: boolean) => void;
}) {
  const controls = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const finish = () =>
      onComplete(!!controls.current?.contains(document.activeElement));
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
    <section
      className="landing-intro"
      data-screen="S01-A"
      aria-label="TUNIT 브랜드 인트로"
      style={{ "--intro-duration": `${INTRO_DURATION}ms` } as CSSProperties}
    >
      <div className="landing-intro-top">
        <span>[ A TUNIT ORIGINAL ]</span>
        <span>2026 / VOL. 01</span>
      </div>
      <div className="landing-intro-center">
        <p>EVERY CONNECTION STARTS WITH A SOUND.</p>
        <h1 aria-label="TUNIT 브랜드 인트로">
          {"Tunit.".split("").map((letter, i) => (
            <span key={i} style={{ animationDelay: `${i * 65}ms` }}>
              {letter}
            </span>
          ))}
        </h1>
        <span className="editorial-handwriting">
          [ 우리를 이어주는, 아주 작은 취향 ]
        </span>
      </div>
      <div ref={controls} className="landing-intro-controls">
        <Link className="landing-action" to="/start">
          내 취향 찾기 <Icon name="arrow" size={20} />
        </Link>
        <button className="landing-skip" onClick={() => onComplete(true)}>
          인트로 건너뛰기 <Icon name="arrow" size={16} />
        </button>
      </div>
    </section>
  );
}
