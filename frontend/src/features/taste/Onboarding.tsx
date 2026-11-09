import { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../../api";
import { useSession } from "../../app/Session";
import { useResource } from "../../hooks/useResource";
import { Heading, Loading, ErrorNotice } from "../../components/Feedback";
import { Art, Icon } from "../../components/ui";
import { SongRow } from "../../components/SongRow";
import { genres, moods } from "../../features/catalog";
import { completeTaste, type Taste } from "../../types";
import { safeReturn } from "../auth/returnTo";

export default function Onboarding() {
  const { step = "intro" } = useParams(),
    navigate = useNavigate(),
    [params] = useSearchParams(),
    session = useSession();
  const catalog = useResource(() => api.catalog(), "catalog");
  const [taste, setTaste] = useState<Taste>(
      structuredClone(session.profile!.taste),
    ),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Error | null>(null),
    [customName, setCustomName] = useState(""),
    [customArtist, setCustomArtist] = useState("");
  const [analysis, setAnalysis] = useState<"loading" | "fallback">("loading");
  const next = safeReturn(params.get("next"));
  const go = (target: string) =>
    navigate(`/onboarding/${target}?next=${encodeURIComponent(next)}`);
  useEffect(() => {
    setQuery("");
    setError(null);
  }, [step]);
  useEffect(() => {
    if (step !== "analyzing") return;
    setAnalysis("loading");
    const id = setTimeout(() => {
      if (!navigator.onLine) {
        setAnalysis("fallback");
        return;
      }
      navigate(`/taste?next=${encodeURIComponent(next)}`, { replace: true });
    }, 1300);
    return () => clearTimeout(id);
  }, [step, next, navigate]);
  if (!["intro", "artists", "tracks", "mood", "analyzing"].includes(step))
    return <Navigate to="/onboarding/intro" replace />;
  if (step === "tracks" && taste.artists.length < 5)
    return <Navigate to="/onboarding/artists" replace />;
  if (step === "mood" && taste.tracks.length < 10)
    return <Navigate to="/onboarding/tracks" replace />;
  if (step === "analyzing" && !completeTaste(session.profile!.taste))
    return <Navigate to="/onboarding/intro" replace />;
  const toggle = (
    key: "artists" | "tracks" | "genres" | "moods",
    value: string,
    max: number,
  ) =>
    setTaste((p) => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter((x) => x !== value)
        : p[key].length < max
          ? [...p[key], value]
          : p[key],
    }));
  const save = async (target: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.saveTaste(taste);
      await session.refresh();
      go(target);
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  };
  if (step === "intro")
    return (
      <section className="focused-view intro" data-screen="S03">
        <p className="eyebrow">LET’S TUNE INTO YOU</p>
        <div className="intro-symbol">✳</div>
        <h1>
          당신의 취향에
          <br />귀 기울이는 시간.
        </h1>
        <p>
          아티스트 다섯, 노래 열 곡, 그리고 지금의 무드.
          <br />
          좋아하는 것들을 한 조각씩 모아볼까요?
        </p>
        <div className="intro-steps">
          <span>
            01 <b>아티스트</b>
          </span>
          <span>
            02 <b>좋아하는 곡</b>
          </span>
          <span>
            03 <b>장르 & 무드</b>
          </span>
        </div>
        <button className="button" onClick={() => go("artists")}>
          좋아하는 것부터 시작하기
          <Icon name="arrow" />
        </button>
        <span className="micro muted">
          단계마다 저장되어 나중에 이어갈 수 있어요.
        </span>
      </section>
    );
  if (step === "analyzing")
    return (
      <section
        className="focused-view analyzing"
        aria-live="polite"
        data-screen="S07"
      >
        <div className="analyze-orbit">
          <span>✳</span>
        </div>
        <p className="eyebrow">TUNING YOUR FREQUENCY</p>
        <h1>
          {analysis === "loading" ? (
            <>
              좋아하는 것들이
              <br />
              당신의 모양이 되는 중.
            </>
          ) : (
            <>
              연결은 잠시 멈춰도,
              <br />
              취향은 이어지니까.
            </>
          )}
        </h1>
        <p>
          {analysis === "loading"
            ? "저장한 음악과 태그에서 취향을 정리하고 있어요."
            : "현재 네트워크를 확인할 수 없습니다. 저장한 정보로 기본 취향을 볼 수 있어요."}
        </p>
        {analysis === "loading" ? (
          <div className="loading-line">
            <span />
          </div>
        ) : (
          <div className="action-row">
            <button
              className="button"
              onClick={() =>
                navigate(`/taste?next=${encodeURIComponent(next)}`)
              }
            >
              기본 취향으로 계속
              <Icon name="arrow" />
            </button>
            <button
              className="text-link"
              onClick={() => {
                setAnalysis("loading");
                go("mood");
              }}
            >
              입력 확인·다시 시도
            </button>
          </div>
        )}
        <p className="sample-note">
          AI 분석이 비활성·실패 상태여도 공통 음악과 태그 기반 기본 분석을
          제공합니다.
        </p>
      </section>
    );
  if (catalog.loading) return <Loading />;
  if (catalog.error)
    return <ErrorNotice error={catalog.error} retry={catalog.reload} />;
  if (!catalog.data) return null;
  const index = ["artists", "tracks", "mood"].indexOf(step);
  const canNext =
    step === "artists"
      ? taste.artists.length === 5
      : step === "tracks"
        ? taste.tracks.length === 10
        : taste.genres.length > 0 && taste.moods.length > 0;
  return (
    <>
      <div className="onboarding-top">
        <button
          className="text-link"
          onClick={() =>
            go(index === 0 ? "intro" : index === 1 ? "artists" : "tracks")
          }
        >
          <Icon name="back" size={17} />
          이전
        </button>
        <div className="step-progress">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= index ? "filled" : ""} />
          ))}
          <small>0{index + 1} / 03</small>
        </div>
      </div>
      <Heading
        id={`S0${index + 4}`}
        label={
          step === "artists"
            ? "YOUR ARTISTS"
            : step === "tracks"
              ? "YOUR LIFE, ON REPEAT"
              : "SET THE MOOD"
        }
        title={
          step === "artists" ? (
            <>
              당신의 세계를 채우는
              <br />
              아티스트 <span className="yellow">다섯.</span>
            </>
          ) : step === "tracks" ? (
            <>
              몇 번을 들어도 좋은
              <br />
              노래 <span className="yellow">열 곡.</span>
            </>
          ) : (
            <>
              지금 당신의
              <br />
              <span className="yellow">주파수</span>는 어떤가요?
            </>
          )
        }
        description="선택한 정보는 중복 없이 저장됩니다. 언제든 다시 고를 수 있어요."
      />
      {error && <ErrorNotice error={error} />}{" "}
      {step !== "mood" && (
        <label className="search-field">
          <Icon name="search" />
          <input
            name="taste-search"
            aria-label="음악·아티스트 검색"
            placeholder="음악 또는 아티스트 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}
      {step === "artists" && (
        <div className="artist-grid">
          {catalog.data.artists
            .filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
            .map((a) => (
              <button
                key={a.id}
                className={`artist-card ${taste.artists.includes(a.id) ? "selected" : ""}`}
                aria-pressed={taste.artists.includes(a.id)}
                disabled={
                  !taste.artists.includes(a.id) && taste.artists.length >= 5
                }
                onClick={() => toggle("artists", a.id, 5)}
              >
                <div className="artist-art">
                  <Art art={a.art} />
                  <span className="artist-monogram">{a.name.slice(0, 1)}</span>
                  <span className="selection-check">
                    <Icon
                      name={taste.artists.includes(a.id) ? "check" : "plus"}
                      size={16}
                    />
                  </span>
                </div>
                <strong>{a.name}</strong>
                <span>{a.genre}</span>
              </button>
            ))}
        </div>
      )}
      {step === "tracks" && (
        <div className="select-tracks">
          {catalog.data.tracks
            .filter((t) =>
              `${t.title} ${t.artist}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((track, i) => (
              <SongRow
                key={track.id}
                track={track}
                index={i}
                selected={taste.tracks.includes(track.id)}
                disabled={
                  !taste.tracks.includes(track.id) && taste.tracks.length >= 10
                }
                onSelect={() => toggle("tracks", track.id, 10)}
              />
            ))}
        </div>
      )}
      {step !== "mood" && (
        <details className="custom-entry">
          <summary>찾는 음악이 없나요? 직접 추가하기</summary>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                if (step === "artists") await api.addArtist(customName);
                else await api.addTrack(customName, customArtist);
                setCustomName("");
                setCustomArtist("");
                catalog.reload();
                setQuery("");
              } catch (e) {
                setError(e as Error);
              }
            }}
          >
            <label>
              {step === "artists" ? "아티스트 이름" : "곡명"}
              <input
                name="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                maxLength={80}
              />
            </label>
            {step === "tracks" && (
              <label>
                아티스트
                <input
                  name="custom-artist"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  required
                  maxLength={80}
                />
              </label>
            )}
            <button className="button" type="submit">
              추가
              <Icon name="plus" size={16} />
            </button>
          </form>
        </details>
      )}
      {step === "mood" && (
        <div className="mood-picker">
          <section>
            <div className="picker-label">
              <h2>자주 머무는 장르</h2>
              <span>1~3개</span>
            </div>
            <div className="choice-chips">
              {genres.map((g) => (
                <button
                  key={g}
                  className={taste.genres.includes(g) ? "selected" : ""}
                  aria-pressed={taste.genres.includes(g)}
                  disabled={
                    !taste.genres.includes(g) && taste.genres.length >= 3
                  }
                  onClick={() => toggle("genres", g, 3)}
                >
                  {g}
                  <Icon
                    name={taste.genres.includes(g) ? "check" : "plus"}
                    size={16}
                  />
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="picker-label">
              <h2>마음이 가는 분위기</h2>
              <span>1~3개</span>
            </div>
            <div className="choice-chips mood-chips">
              {moods.map((m) => (
                <button
                  key={m}
                  className={taste.moods.includes(m) ? "selected" : ""}
                  aria-pressed={taste.moods.includes(m)}
                  disabled={!taste.moods.includes(m) && taste.moods.length >= 3}
                  onClick={() => toggle("moods", m, 3)}
                >
                  {m}
                  <Icon
                    name={taste.moods.includes(m) ? "check" : "plus"}
                    size={16}
                  />
                </button>
              ))}
            </div>
          </section>
          <label className="privacy-option">
            <span>
              <strong>내 취향 프로필 공개</strong>
              <small>
                공개한 취향만 Music Twin·친구 궁합에 사용합니다. 혼자 탐색은
                비공개로도 이용할 수 있어요.
              </small>
            </span>
            <input
              role="switch"
              type="checkbox"
              checked={taste.public}
              onChange={(e) =>
                setTaste((p) => ({ ...p, public: e.target.checked }))
              }
            />
          </label>
        </div>
      )}
      <div className="selection-footer">
        <div>
          <strong>
            {step === "artists"
              ? `${taste.artists.length} / 5`
              : step === "tracks"
                ? `${taste.tracks.length} / 10`
                : `${taste.genres.length + taste.moods.length}개 선택`}
          </strong>
          <span>좋아하는 취향을 모으는 중</span>
        </div>
        <button
          className="button"
          disabled={!canNext || busy}
          onClick={() =>
            void save(
              step === "artists"
                ? "tracks"
                : step === "tracks"
                  ? "mood"
                  : "analyzing",
            )
          }
        >
          {busy
            ? "저장 중…"
            : step === "mood"
              ? "나의 취향 완성하기"
              : "다음으로"}
          <Icon name="arrow" />
        </button>
      </div>
    </>
  );
}
