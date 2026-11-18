import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../../app/Session";
import { Icon } from "../ui";

const entries = [
  { to: "/landing", name: "The beginning", label: "서비스 소개" },
  { to: "/home", name: "My frequency", label: "나의 홈" },
  { to: "/discover", name: "Music twin", label: "닮은 취향 발견" },
  { to: "/music", name: "New favorites", label: "새로운 음악" },
  { to: "/my", name: "My taste", label: "내 취향 관리" },
];
export default function EditorialHeader({
  landing,
  open,
  onOpenChange,
}: {
  landing: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useSession(),
    location = useLocation();
  const trigger = useRef<HTMLButtonElement>(null),
    closeButton = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null),
    restore = useRef(true);
  const close = (focus = true) => {
    restore.current = focus;
    onOpenChange(false);
  };
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        restore.current = true;
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) || [],
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      if (restore.current) trigger.current?.focus();
    };
  }, [open, onOpenChange]);
  return (
    <header className="site-header editorial-header">
      <div
        className="editorial-header-row"
        inert={open || undefined}
        aria-hidden={open || undefined}
      >
        <Link
          className="editorial-glyph"
          aria-label="TUNIT 처음으로"
          to="/landing"
        >
          t<span>.</span>
        </Link>
        <span className="editorial-edition">
          INDEPENDENT TASTE, SHARED FREQUENCY.
          <br />
          <span>[ TUNIT — VOL. 01 / 2026 ]</span>
        </span>
        <div className="editorial-header-actions">
          <Link className="editorial-account" to={user ? "/my" : "/login"}>
            {user ? "내 취향" : "로그인"}
          </Link>
          {landing && (
            <Link className="editorial-start" to="/start">
              시작하기 <Icon name="arrow" size={15} />
            </Link>
          )}
          <button
            ref={trigger}
            className="editorial-menu-trigger"
            aria-label="메뉴 열기"
            aria-expanded={open}
            aria-controls="editorial-menu"
            onClick={() => {
              restore.current = true;
              onOpenChange(true);
            }}
          >
            + MENU
          </button>
        </div>
      </div>
      {open && (
        <div
          id="editorial-menu"
          ref={panel}
          className="editorial-menu"
          role="dialog"
          aria-modal="true"
          aria-label="전체 메뉴"
        >
          <div className="editorial-menu-top">
            <span>[ SELECT YOUR FREQUENCY ]</span>
            <button
              ref={closeButton}
              aria-label="메뉴 닫기"
              onClick={() => close()}
            >
              − CLOSE
            </button>
          </div>
          <nav aria-label="화면 이동">
            {entries.map((entry, i) => (
              <Link
                key={entry.to}
                to={entry.to}
                aria-current={
                  location.pathname === entry.to ? "page" : undefined
                }
                onClick={() => close(false)}
              >
                <span className="editorial-menu-index">0{i + 1}</span>
                <span className="editorial-menu-name">{entry.name}</span>
                <span className="editorial-menu-caption">{entry.label}</span>
                <Icon name="arrow" size={24} />
              </Link>
            ))}
          </nav>
          <div className="editorial-menu-bottom">
            <span>GOOD MUSIC. BETTER CONNECTIONS.</span>
            <span>[ 취향으로 이어지는 사이 ]</span>
          </div>
        </div>
      )}
    </header>
  );
}
