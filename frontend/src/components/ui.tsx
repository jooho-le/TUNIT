import { type ReactNode } from "react";
import { tracks } from "../features/catalog";
type IconName =
  | "arrow"
  | "home"
  | "discover"
  | "music"
  | "user"
  | "search"
  | "plus"
  | "check"
  | "back"
  | "external"
  | "heart"
  | "close"
  | "spark"
  | "headphones";
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    discover: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2 6-6 2 2-6Z" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l12-2v13M9 9l12-2" />
        <ellipse cx="6" cy="18" rx="3" ry="3" />
        <ellipse cx="18" cy="16" rx="3" ry="3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    spark: (
      <path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z" />
    ),
    headphones: (
      <>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <rect x="3" y="12" width="4" height="8" rx="2" />
        <rect x="17" y="12" width="4" height="8" rx="2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Wordmark() {
  return <span className="wordmark">TUNIT.</span>;
}

export function Art({
  art,
  className = "",
  label,
}: {
  art: string;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`cover art-${art} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <i />
      <b />
      <span className="art-grain" />
    </div>
  );
}
export function Vinyl({ small = false }: { small?: boolean }) {
  return (
    <div className={`vinyl ${small ? "small" : ""}`} aria-hidden="true">
      <div className="vinyl-label">
        <span>TUNIT RECORDS</span>
        <strong>T.</strong>
        <span>SIDE A · 33⅓ RPM</span>
      </div>
    </div>
  );
}

export const discovery = (index: number) => {
  window.open(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${tracks[index].artist} ${tracks[index].title} official`)}`,
    "_blank",
    "noopener,noreferrer",
  );
};
export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="tag">{children}</span>
);
export const Button = ({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) => (
  <button
    className={`button ${secondary ? "secondary" : ""}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
    <Icon name="arrow" size={19} />
  </button>
);
export const SectionHead = ({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) => (
  <div className="section-head">
    <div>
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
    </div>
    {children}
  </div>
);
export const TrackRow = ({
  index,
  selectable = false,
  selected = false,
  disabled = false,
  onSelect,
}: {
  index: number;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) => {
  const track = tracks[index];
  return (
    <button
      className={`track-row ${selected && selectable ? "selected" : ""}`}
      data-reveal={`delay-${index % 3}`}
      onClick={() => (selectable ? onSelect?.() : discovery(index))}
      aria-pressed={selectable ? selected : undefined}
      disabled={disabled}
    >
      <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
      <Art art={track.art} />
      <span className="track-info">
        <strong>{track.title}</strong>
        <span>{track.artist}</span>
      </span>
      <span className="track-time">{track.length}</span>
      <span className="track-action">
        <Icon
          name={selectable ? (selected ? "check" : "plus") : "external"}
          size={17}
        />
      </span>
    </button>
  );
};
