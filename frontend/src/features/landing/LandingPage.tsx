import { useCallback, useEffect, useRef, useState } from "react";
import HeroSection from "./HeroSection";
import FeatureStory from "./FeatureStory";
import FinalCTA from "./FinalCTA";
import { INTRO_SEEN_KEY } from "./content";
import { attachLandingMotion, shouldPlayIntro } from "./motion";

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLAnchorElement>(null);
  const [introActive, setIntroActive] = useState(shouldPlayIntro);
  const finishIntro = useCallback((restoreFocus = false) => {
    setIntroActive(false);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "seen");
    } catch {
      /* Nonessential preference: keep the page usable without storage. */
    }
    if (restoreFocus) startRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (root.current) return attachLandingMotion(root.current);
  }, []);
  return (
    <div ref={root} className="landing-page" data-screen="S01">
      <HeroSection
        introActive={introActive}
        onIntroComplete={finishIntro}
        startRef={startRef}
      />
      <FeatureStory />
      <FinalCTA />
    </div>
  );
}
