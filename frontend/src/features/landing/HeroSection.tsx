import { type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";
import PaintSplash from "../../components/PaintSplash";
import IntroSequence from "./IntroSequence";
import { scrollToLandingSection } from "./content";

const heights = [
  18, 28, 46, 32, 64, 42, 86, 56, 100, 72, 44, 92, 60, 36, 82, 100, 62, 84, 42,
  68, 100, 78, 46, 92, 52, 70, 36, 58, 42, 24, 34, 16,
];
export function SoundWave({ className = "" }: { className?: string }) {
  return (
    <div className={`landing-wave ${className}`} aria-hidden="true">
      {heights.map((height, i) => (
        <i
          key={i}
          style={
            {
              "--bar-height": `${height}%`,
              "--bar-delay": `${i * -83}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function HeroSection({
  introActive,
  onIntroComplete,
  startRef,
}: {
  introActive: boolean;
  onIntroComplete: (restoreFocus?: boolean) => void;
  startRef: RefObject<HTMLAnchorElement | null>;
}) {
  return (
    <section
      className="landing-hero"
      data-screen="S01-B"
      data-scroll-scene
      data-loop-scene
      aria-labelledby="landing-title"
    >
      <div className="landing-hero-topline">
        <span>A CONNECTION BEYOND THE PLAYLIST.</span>
        <span>EST. 2026 / TUNIT</span>
      </div>
      <div className="landing-hero-grid">
        <div className="landing-hero-copy">
          <p className="landing-kicker">
            <span />
            음악으로 시작되는 새로운 연결
          </p>
          <h1 id="landing-title">
            <span>취향이 맞는</span>
            <br />
            <span>
              사람을 <em>발견하다.</em>
            </span>
          </h1>
          <p className="landing-hero-description">
            같은 노래에 마음이 움직였다면.
            <br />
            우리, 조금은 닮아 있을지도.
          </p>
          <div className="landing-hero-actions">
            <Link ref={startRef} className="landing-action" to="/start">
              내 취향 찾기 <Icon name="arrow" />
            </Link>
            <a
              className="landing-text-link"
              href="#landing-stories"
              onClick={(e) => {
                e.preventDefault();
                scrollToLandingSection("landing-stories");
              }}
            >
              먼저 둘러볼게요 <span>↓</span>
            </a>
          </div>
          <div className="landing-hero-signature">
            <span>TASTE.</span>
            <span>TUNE.</span>
            <span>TOGETHER.</span>
          </div>
        </div>
        <div className="landing-hero-visual" data-intro-active={introActive}>
          <div className="landing-sound-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
            <span className="landing-orbit-dot" />
          </div>
          <div className="landing-hero-paint" aria-hidden="true">
            <PaintSplash />
          </div>
          <div className="landing-headphone">
            <img
              src="/assets/listening-object-yellow.png"
              width="1536"
              height="1024"
              fetchPriority="high"
              alt="보라색 물감과 음파 사이에 떠 있는 노란 헤드셋"
            />
          </div>
          <div className="landing-frequency-label" aria-hidden="true">
            <span>
              ON YOUR
              <br />
              FREQUENCY.
            </span>
            <b>↗</b>
          </div>
          {introActive && <IntroSequence onComplete={onIntroComplete} />}
        </div>
        <SoundWave className="landing-hero-wave" />
      </div>
      <div className="landing-hero-baseline">
        <span>
          LESS SMALL TALK.
          <br />
          MORE SHARED MUSIC.
        </span>
        <SoundWave />
        <a
          href="#landing-stories"
          className="landing-scroll"
          onClick={(e) => {
            e.preventDefault();
            scrollToLandingSection("landing-stories");
          }}
        >
          SCROLL TO FEEL THE CONNECTION <span>↓</span>
        </a>
      </div>
    </section>
  );
}
