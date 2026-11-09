import { Component, useEffect, useRef, type ReactNode } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SessionProvider, useSession } from "./Session";
import { attachScrollMotion } from "../hooks/scrollMotion";
import { Icon, Wordmark } from "../components/ui";
import { ErrorNotice, Loading } from "../components/Feedback";
import LandingPage from "../features/landing/LandingPage";
import { scrollToLandingSection } from "../features/landing/content";
import Auth from "../features/auth/Auth";
import Onboarding from "../features/taste/Onboarding";
import Home from "../pages/Home";
import Taste from "../features/taste/Taste";
import { Discover, CandidateEmpty } from "../features/matching/Discover";
import { Person } from "../features/matching/Person";
import { Music } from "../features/discovery/Music";
import {
  InvitationCreate,
  InvitationStatus,
  FriendComparison,
} from "../features/invitations/Invitations";
import {
  InterestCompose,
  InterestList,
  Connections,
} from "../features/interests/Interests";
import { Follow, Share, Roadmap } from "../features/social/Social";

export const mainNavigation = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/discover", label: "Discover", icon: "discover" },
  { to: "/music", label: "Music", icon: "music" },
  { to: "/my", label: "My Taste", icon: "user" },
] as const;
function Protected({ requireTaste = true }: { requireTaste?: boolean }) {
  const session = useSession(),
    location = useLocation();
  if (!session.ready) return <Loading />;
  if (session.error)
    return (
      <ErrorNotice
        error={new Error(session.error)}
        retry={() => void session.refresh()}
      />
    );
  if (!session.user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (requireTaste && !session.profile?.complete)
    return <Navigate to="/onboarding/intro" replace />;
  return <Outlet />;
}
function StartRoute() {
  const session = useSession();
  if (!session.ready) return <Loading />;
  if (session.error)
    return (
      <ErrorNotice
        error={new Error(session.error)}
        retry={() => void session.refresh()}
      />
    );
  return (
    <Navigate
      to={
        !session.user
          ? "/login"
          : session.profile?.complete
            ? "/home"
            : "/onboarding/intro"
      }
      replace
    />
  );
}
function Layout() {
  const root = useRef<HTMLElement>(null),
    location = useLocation(),
    session = useSession();
  const editorial =
      location.pathname === "/landing" || location.pathname === "/",
    onboarding = location.pathname.startsWith("/onboarding"),
    showNav =
      !!session.user &&
      !!session.profile?.complete &&
      !onboarding &&
      !editorial;
  useEffect(() => {
    window.scrollTo({ top: 0 });
    root.current?.focus({ preventScroll: true });
    const node = root.current;
    if (node) return attachScrollMotion(node);
  }, [location.pathname]);
  return (
    <div className={`app ${editorial ? "is-editorial" : ""}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          root.current?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <header className={`site-header ${editorial ? "landing-header" : ""}`}>
        <Link className="brand" aria-label="TUNIT 처음으로" to="/landing">
          <Wordmark />
        </Link>
        <span className="header-caption">
          MUSIC IS PERSONAL.
          <br />
          CONNECTION IS HUMAN.
        </span>
        {editorial ? (
          <>
            <nav className="landing-header-nav" aria-label="랜딩 메뉴">
              <a
                href="#landing-stories"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToLandingSection("landing-stories");
                }}
              >
                취향을 잇는 방법
              </a>
              <a
                href="#landing-friends"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToLandingSection("landing-friends");
                }}
              >
                친구와 비교
              </a>
            </nav>
            <div className="landing-header-actions">
              <Link to={session.user ? "/my" : "/login"}>
                {session.user ? "내 취향" : "로그인"}
              </Link>
              <Link className="landing-header-start" to="/start">
                시작하기 <Icon name="arrow" size={15} />
              </Link>
            </div>
          </>
        ) : (
          <>
            <nav className="site-nav" aria-label="메인 메뉴">
              {mainNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {item.label.toUpperCase()}
                </NavLink>
              ))}
            </nav>
            {session.user ? (
              <Link className="header-account" to="/my">
                {session.user.nickname}
              </Link>
            ) : (
              <Link className="header-account" to="/login">
                로그인
              </Link>
            )}
          </>
        )}
      </header>
      <main
        id="main-content"
        ref={root}
        tabIndex={-1}
        className={`content ${editorial ? "route-landing editorial-canvas" : "application-canvas"} ${showNav ? "has-mobile-nav" : ""}`}
      >
        {!session.ready && !editorial ? <Loading /> : <Outlet />}
        <footer className="page-footer">
          <span>© TUNIT 2026</span>
          <Link to="/landing">SAME TASTE. NEW CONNECTION. ↗</Link>
          <span>FIND YOUR FREQUENCY.</span>
        </footer>
      </main>
      {showNav && (
        <nav className="bottom-navigation" aria-label="하단 내비게이션">
          {mainNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>화면을 불러오지 못했어요.</h1>
        <p>브라우저에 저장된 데이터는 삭제하지 않았습니다.</p>
        <button className="button" onClick={() => window.location.reload()}>
          다시 열기
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <HashRouter>
        <SessionProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/landing" replace />} />
              <Route path="landing" element={<LandingPage />} />
              <Route path="start" element={<StartRoute />} />
              <Route path="login" element={<Auth />} />
              <Route path="invite/:token" element={<InvitationStatus />} />
              <Route element={<Protected requireTaste={false} />}>
                <Route path="onboarding/:step" element={<Onboarding />} />
                <Route path="my" element={<Taste view="my" />} />
              </Route>
              <Route element={<Protected />}>
                <Route path="taste" element={<Taste view="result" />} />
                <Route path="home" element={<Home />} />
                <Route path="solo" element={<Taste view="solo" />} />
                <Route path="discover" element={<Discover />} />
                <Route path="empty" element={<CandidateEmpty />} />
                <Route path="people/:userId" element={<Person />} />
                <Route path="matches/:userId" element={<Person compare />} />
                <Route path="music" element={<Music />} />
                <Route path="invite" element={<InvitationCreate />} />
                <Route path="friends/:token" element={<FriendComparison />} />
                <Route path="interest/:userId" element={<InterestCompose />} />
                <Route
                  path="interests/inbox"
                  element={<InterestList kind="inbox" />}
                />
                <Route
                  path="interests/sent"
                  element={<InterestList kind="sent" />}
                />
                <Route path="connections" element={<Connections />} />
                <Route path="follow/:userId" element={<Follow />} />
                <Route path="share/:userId" element={<Share />} />
                <Route
                  path="chat/:connectionId"
                  element={<Roadmap kind="chat" />}
                />
                <Route
                  path="playlist/:connectionId"
                  element={<Roadmap kind="playlist" />}
                />
                <Route path="feed" element={<Roadmap kind="feed" />} />
              </Route>
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Route>
          </Routes>
        </SessionProvider>
      </HashRouter>
    </AppErrorBoundary>
  );
}
