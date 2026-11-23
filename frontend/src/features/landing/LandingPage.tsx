import { useEffect, useRef } from "react";
import HeroSection from "./HeroSection";
import FeatureStory from "./FeatureStory";
import FinalCTA from "./FinalCTA";
import { attachLandingMotion } from "./motion";

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null),
    startRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (root.current) return attachLandingMotion(root.current);
  }, []);
  return (
    <div ref={root} className="landing-page" data-screen="S01">
      <div className="landing-story-content">
        <HeroSection startRef={startRef} />
        <FeatureStory />
        <FinalCTA />
      </div>
    </div>
  );
}
