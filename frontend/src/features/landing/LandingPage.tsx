import { useCallback, useEffect, useRef, useState } from "react";
import HeroSection from "./HeroSection";
import IntroSequence from "./IntroSequence";
import FeatureStory from "./FeatureStory";
import FinalCTA from "./FinalCTA";
import { INTRO_SEEN_KEY } from "./content";
import { attachLandingMotion, shouldPlayIntro } from "./motion";

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null),
    startRef = useRef<HTMLAnchorElement>(null);
  const [introActive, setIntroActive] = useState(shouldPlayIntro);
  const restoreFocus = useRef(false);
  const finishIntro = useCallback((shouldRestoreFocus = false) => {
    restoreFocus.current = shouldRestoreFocus;
    setIntroActive(false);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "seen");
    } catch {
      /* The intro is optional even when storage is unavailable. */
    }
  }, []);
  useEffect(() => {
    if (root.current) return attachLandingMotion(root.current);
  }, []);
  useEffect(() => {
    const explore = () => finishIntro(false);
    window.addEventListener("tunit:explore-landing", explore);
    return () => window.removeEventListener("tunit:explore-landing", explore);
  }, [finishIntro]);
  useEffect(() => {
    if (!introActive && restoreFocus.current) {
      startRef.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [introActive]);
  return (
    <div ref={root} className="landing-page" data-screen="S01">
      {introActive && <IntroSequence onComplete={finishIntro} />}
      <div
        className="landing-story-content"
        inert={introActive || undefined}
        aria-hidden={introActive || undefined}
      >
        <HeroSection startRef={startRef} />
        <FeatureStory />
        <FinalCTA />
      </div>
    </div>
  );
}
