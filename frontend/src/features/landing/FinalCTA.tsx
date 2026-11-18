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
      <div className="landing-final-title" aria-hidden="true">
        Stay curious.
        <br />
        <em>Find your people.</em>
      </div>
      <div className="landing-final-copy" data-reveal>
        <p className="landing-kicker">[ YOUR PEOPLE ARE ON YOUR FREQUENCY. ]</p>
        <h2 id="landing-final-title">
          다음 연결의 시작은,
          <br />
          당신의 취향.
        </h2>
        <Link className="landing-action" to="/start">
          지금 시작하기 <Icon name="arrow" size={20} />
        </Link>
        <p>같은 음악에서, 새로운 우리로.</p>
      </div>
      <div className="landing-connection-map" aria-hidden="true">
        <svg viewBox="0 0 650 70" fill="none">
          <path d="M25 35H625" />
          <circle cx="25" cy="35" r="7" />
          <circle cx="225" cy="35" r="7" />
          <circle cx="425" cy="35" r="7" />
          <circle cx="625" cy="35" r="7" />
        </svg>
      </div>
    </section>
  );
}
