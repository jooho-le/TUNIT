import { Art, Icon } from "./ui";
import type { Track } from "../types";
export const musicUrl = (track: Track) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title} official`)}`;
export function SongRow({
  track,
  index = 0,
  selected,
  onSelect,
  disabled = false,
  children,
}: {
  track: Track;
  index?: number;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
      <Art art={track.art} />
      <span className="track-info">
        <strong>{track.title}</strong>
        <span>{track.artist}</span>
      </span>
      <span className="track-time">{track.length}</span>
      <span className="track-action">
        <Icon
          name={onSelect ? (selected ? "check" : "plus") : "external"}
          size={17}
        />
      </span>
    </>
  );
  return (
    <div className="song-row-wrap">
      {onSelect ? (
        <button
          className={`track-row ${selected ? "selected" : ""}`}
          aria-pressed={selected}
          disabled={disabled}
          onClick={onSelect}
        >
          {body}
        </button>
      ) : (
        <a
          className="track-row"
          href={musicUrl(track)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${track.title} 외부 음악 검색`}
        >
          {body}
        </a>
      )}
      {children}
    </div>
  );
}
