import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SessionProvider, useSession } from "./Session";
import { attachScrollMotion } from "../hooks/scrollMotion";
import { ErrorNotice, Loading } from "../components/Feedback";
import LandingPage from "../features/landing/LandingPage";
import EditorialHeader from "../components/shell/EditorialHeader";
import EditorialReel from "../components/shell/EditorialReel";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const editorial =
    location.pathname === "/landing" || location.pathname === "/";
  const showNav =
    !!session.user &&
    !!session.profile?.complete &&
    !location.pathname.startsWith("/onboarding") &&
    !editorial;
  useEffect(() => {
    window.scrollTo({ top: 0 });
    root.current?.focus({ preventScroll: true });
    if (root.current) return attachScrollMotion(root.current);
  }, [location.pathname]);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  return (
    <div className={`app freshman-shell ${editorial ? "is-editorial" : ""}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          root.current?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <EditorialHeader
        landing={editorial}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      />
      <main
        id="main-content"
        ref={root}
        tabIndex={-1}
        inert={menuOpen || undefined}
        aria-hidden={menuOpen || undefined}
        className={`content ${editorial ? "route-landing editorial-canvas" : "application-canvas"}`}
      >
        {!session.ready && !editorial ? <Loading /> : <Outlet />}
        <footer className="page-footer">
          <span>© TUNIT 2026</span>
          <Link to="/landing">SAME TASTE. NEW CONNECTION. ↗</Link>
          <span>[ GOOD MUSIC. BETTER PEOPLE. ]</span>
        </footer>
      </main>
      <div inert={menuOpen || undefined} aria-hidden={menuOpen || undefined}>
        <EditorialReel landing={editorial} authenticated={showNav} />
      </div>
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
