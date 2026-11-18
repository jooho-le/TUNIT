import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  stories,
  scrollToLandingSection,
} from "../../features/landing/content";

const navigation = [
  { to: "/home", title: "홈", caption: "HOME", art: "home" },
  { to: "/discover", title: "사람 찾기", caption: "DISCOVER", art: "twin" },
  { to: "/music", title: "음악 발견", caption: "MUSIC", art: "music" },
  { to: "/my", title: "내 취향", caption: "MY TASTE", art: "taste" },
];
const labels = ["TASTE PROFILE", "MUSIC TWIN", "NEW FAVORITES", "WITH FRIENDS"];
const chapterNames = ["취향 분석", "사람 찾기", "음악 발견", "친구와 비교"];
export default function EditorialReel({
  landing,
  authenticated,
}: {
  landing: boolean;
  authenticated: boolean;
}) {
  const [chapter, setChapter] = useState("");
  const { pathname } = useLocation();
  useEffect(() => {
    setChapter("");
    if (!landing || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );
        const node = visible[0]?.target as HTMLElement | undefined;
        if (node) setChapter(node.dataset.landingChapter || "");
      },
      { rootMargin: "-15% 0px -45% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("[data-landing-chapter]")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [landing, pathname]);
  return (
    <div className="editorial-reel">
      <div className="editorial-reel-edition">
        <span>{landing ? "THE TUNIT INDEX" : "YOUR LISTENING ROOM"}</span>
        <span>[ 2026 / VOL. 01 ]</span>
      </div>
      {landing ? (
        <nav className="editorial-reel-items" aria-label="랜딩 챕터">
          {stories.map((story, i) => (
            <a
              key={story.id}
              href={`#landing-${story.id}`}
              aria-current={chapter === story.number ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                scrollToLandingSection(`landing-${story.id}`);
              }}
            >
              <span
                className={`editorial-reel-art reel-art-${story.id}`}
                aria-hidden="true"
              >
                <i />
                <b />
              </span>
              <span className="editorial-reel-copy">
                <strong>
                  <small aria-hidden="true">{story.number}</small>
                  {chapterNames[i]}
                </strong>
                <span>
                  {labels[i]}
                </span>
              </span>
              <span className="editorial-reel-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </nav>
      ) : authenticated ? (
        <nav className="editorial-reel-items" aria-label="하단 내비게이션">
          {navigation.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span
                className={`editorial-reel-art reel-art-${item.art}`}
                aria-hidden="true"
              >
                <i />
                <b />
              </span>
              <span className="editorial-reel-copy">
                <strong>
                  <small aria-hidden="true">0{i + 1}</small>
                  {item.title}
                </strong>
                <span>{item.caption}</span>
              </span>
              <span className="editorial-reel-arrow" aria-hidden="true">
                ↗
              </span>
            </NavLink>
          ))}
        </nav>
      ) : (
        <div className="editorial-reel-note">
          <Link to="/landing">BACK TO THE BEGINNING ↗</Link>
          <span>[ 좋아하는 음악에서, 새로운 우리로. ]</span>
        </div>
      )}
    </div>
  );
}
