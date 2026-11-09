import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";

export default function FinalCTA() {
  return (
    <section
      className="landing-final"
      data-screen="S01-D"
      data-scroll-scene
      data-loop-scene
      aria-labelledby="landing-final-title"
    >
      <div className="landing-connection-map" aria-hidden="true">
        <svg viewBox="0 0 1000 430" fill="none">
          <path d="M85 115C250 20 270 355 500 210S740 45 915 310M180 360C300 255 330 100 500 210S720 395 860 95M500 210V30M500 210V410" />
          <circle cx="500" cy="210" r="98" />
          <circle cx="500" cy="210" r="145" />
        </svg>
        <span className="landing-map-node node-one">
          <Icon name="music" size={28} />
        </span>
        <span className="landing-map-node node-two">
          <Icon name="headphones" size={28} />
        </span>
        <span className="landing-map-node node-three">
          <Icon name="spark" size={28} />
        </span>
        <span className="landing-map-node node-four">
          <Icon name="user" size={28} />
        </span>
        <span className="landing-map-center">T.</span>
      </div>
      <div className="landing-final-copy" data-reveal>
        <p className="landing-kicker">YOUR PEOPLE ARE ON YOUR FREQUENCY.</p>
        <h2 id="landing-final-title">
          다음 연결의 시작은,
          <br />
          <em>당신의 취향.</em>
        </h2>
        <Link className="landing-action" to="/start">
          지금 시작하기 <Icon name="arrow" />
        </Link>
        <p>같은 음악에서, 새로운 우리로.</p>
      </div>
    </section>
  );
}
