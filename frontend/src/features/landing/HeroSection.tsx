import { type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";
import PaintSplash from "../../components/PaintSplash";
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
  startRef,
}: {
  startRef: RefObject<HTMLAnchorElement | null>;
}) {
  return (
    <section
      className="landing-hero"
      data-screen="S01-B"
      data-landing-chapter="00"
      data-scroll-scene
      data-loop-scene
      aria-labelledby="landing-title"
    >
      <div className="landing-hero-topline">
        <span>MUSIC IS PERSONAL. CONNECTION IS HUMAN.</span>
        <span>[ AN INDEPENDENT TASTE STUDY ]</span>
      </div>
      <div className="landing-wordmark-stage">
        <span className="landing-side-label">[ THE BEGINNING / 00 ]</span>
        <h1 id="landing-title" aria-label="TUNIT — 취향이 맞는 사람을 발견하다">
          <span>Tunit</span>
          <em>.</em>
        </h1>
        <span className="landing-volume">
          VOL.
          <br />
          001
        </span>
      </div>
      <div className="landing-hero-caption">
        <p>
          취향이 맞는 사람을 발견하다.
          <br />
          <span>같은 노래에 마음이 움직였다면.</span>
        </p>
        <span className="editorial-handwriting">
          [ good music. better people. ]
        </span>
      </div>
      <div className="landing-hero-bottom">
        <div className="landing-sound-object">
          <div className="landing-sound-thumbnail">
            <PaintSplash />
            <img
              src="/assets/listening-object-yellow.png"
              alt="보라색 물감 위의 노란 헤드셋"
              width="1536"
              height="1024"
              fetchPriority="high"
            />
          </div>
          <span>
            SOUND OBJECT — 001
            <br />
            <small>THE ART OF LISTENING.</small>
          </span>
        </div>
        <div className="landing-hero-actions">
          <Link ref={startRef} className="landing-action" to="/start">
            내 취향 찾기 <Icon name="arrow" size={20} />
          </Link>
          <a
            className="landing-text-link"
            href="#landing-stories"
            onClick={(event) => {
              event.preventDefault();
              scrollToLandingSection("landing-stories");
            }}
          >
            먼저 둘러볼게요 <span>↓</span>
          </a>
        </div>
        <span className="landing-hero-note">
          LESS SMALL TALK.
          <br />
          MORE SHARED MUSIC.
        </span>
      </div>
    </section>
  );
}
