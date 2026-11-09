import { Icon } from "../../components/ui";
import { SoundWave } from "./HeroSection";
import { stories, type Story } from "./content";

function Record({
  tone = "yellow",
  label,
}: {
  tone?: "yellow" | "purple";
  label: string;
}) {
  return (
    <div className={`landing-record ${tone}`}>
      <div className="landing-record-grooves" />
      <div className="landing-record-label">
        <span>TUNIT RECORDS</span>
        <b>{label}</b>
        <span>THE SOUND OF YOU</span>
      </div>
    </div>
  );
}
function TastePreview() {
  return (
    <div className="landing-taste-preview" aria-hidden="true">
      <div className="landing-preview-top">
        <span>YOUR TASTE ID</span>
        <Icon name="spark" size={18} />
      </div>
      <div className="landing-taste-flower">✳</div>
      <span className="landing-preview-eyebrow">나의 취향을 이루는 조각들</span>
      <strong>
        나만의
        <br />
        주파수.
      </strong>
      <div className="landing-preview-tags">
        <span>INDIE</span>
        <span>JAZZ</span>
        <span>몽환적인</span>
      </div>
      <div className="landing-preview-bottom">
        <span>TUNIT.</span>
        <SoundWave />
      </div>
    </div>
  );
}
function TwinPreview() {
  return (
    <div className="landing-twin-preview" aria-hidden="true">
      <div className="landing-twin-record a">
        <span>MY TASTE</span>
        <Record label="ME" />
      </div>
      <div className="landing-twin-record b">
        <span>YOUR TASTE</span>
        <Record tone="purple" label="YOU" />
      </div>
      <div className="landing-twin-center">
        <Icon name="headphones" size={28} />
        <span>SAME FREQUENCY.</span>
      </div>
    </div>
  );
}
function DiscoveryPreview() {
  return (
    <div className="landing-discovery-preview" aria-hidden="true">
      {[
        { title: "seasons", artist: "wave to earth", tone: "yellow" },
        { title: "Square (2017)", artist: "백예린", tone: "purple" },
        { title: "TOMBOY", artist: "혁오", tone: "yellow" },
      ].map((track, i) => (
        <div className={`landing-album album-${i}`} key={track.title}>
          <div className={`landing-album-art ${track.tone}`}>
            <div className="landing-album-orbit" />
            <span>{["S", "S", "T"][i]}</span>
            <Icon name="music" size={20} />
          </div>
          <strong>{track.title}</strong>
          <small>{track.artist}</small>
        </div>
      ))}
      <div className="landing-now-playing">
        <span className="landing-play-mark">↗</span>
        <div>
          <strong>YOUR NEXT FAVORITE</strong>
          <span>새로운 음악이 기다리는 곳</span>
        </div>
        <SoundWave />
      </div>
    </div>
  );
}
function FriendsPreview() {
  return (
    <div className="landing-friend-preview" aria-hidden="true">
      <div className="landing-friend-link">
        <Icon name="external" size={16} />
        <span>YOU’RE INVITED.</span>
        <Icon name="check" size={16} />
      </div>
      <div className="landing-friend-pair">
        <div>
          <span>
            <Icon name="user" size={36} />
          </span>
          <small>나의 취향</small>
        </div>
        <i>＋</i>
        <div>
          <span>
            <Icon name="user" size={36} />
          </span>
          <small>친구의 취향</small>
        </div>
      </div>
      <div className="landing-friend-overlap">
        <i />
        <i />
        <span>
          <Icon name="music" size={24} />
        </span>
      </div>
      <strong>
        함께 좋아하는 곡.
        <br />
        새롭게 알게 된 우리.
      </strong>
      <span className="landing-friend-note">
        서로의 동의로 열리는 1:1 음악 궁합
      </span>
    </div>
  );
}
const previews = {
  taste: TastePreview,
  twin: TwinPreview,
  discovery: DiscoveryPreview,
  friends: FriendsPreview,
};
function StorySection({ story }: { story: Story }) {
  const Preview = previews[story.id];
  return (
    <section
      className={`landing-story landing-story-${story.id}`}
      id={`landing-${story.id}`}
      data-screen="S01-C"
      data-scroll-scene
      data-loop-scene
      aria-labelledby={`landing-${story.id}-title`}
    >
      <div className="landing-story-rail">
        <span>{story.number} / 04</span>
        <span>{story.label}</span>
      </div>
      <div className="landing-story-grid">
        <div className="landing-story-copy" data-reveal>
          <p className="landing-kicker">
            <span />
            {
              [
                "취향 분석",
                "Music Twin",
                "새로운 음악 발견",
                "친구와 1:1 비교",
              ][Number(story.number) - 1]
            }
          </p>
          <h2 id={`landing-${story.id}-title`}>
            {story.title[0]}
            <br />
            <em>{story.title[1]}</em>
          </h2>
          <p>{story.description}</p>
          <span className="landing-story-detail">{story.detail}</span>
        </div>
        <figure className="landing-story-stage" data-reveal="zoom">
          <Preview />
          <figcaption>INTERFACE STUDY / 화면 미리보기</figcaption>
        </figure>
      </div>
    </section>
  );
}
export default function FeatureStory() {
  return (
    <div id="landing-stories">
      <div className="landing-story-introduction" data-reveal>
        <span>
          FROM YOUR MUSIC
          <br />
          TO YOUR PEOPLE.
        </span>
        <p>
          좋아하는 것에서 시작해서,
          <br />
          <strong>좋아하게 될 사람까지.</strong>
        </p>
      </div>
      {stories.map((story) => (
        <StorySection key={story.id} story={story} />
      ))}
    </div>
  );
}
