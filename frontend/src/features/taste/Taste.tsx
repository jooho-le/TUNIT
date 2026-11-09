import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { useSession } from "../../app/Session";
import { useResource } from "../../hooks/useResource";
import { Heading, Loading, ErrorNotice } from "../../components/Feedback";
import { Icon, Tag, Wordmark } from "../../components/ui";
import { SongRow } from "../../components/SongRow";
import { safeReturn } from "../auth/returnTo";

export default function Taste({ view }: { view: "result" | "my" | "solo" }) {
  const session = useSession(),
    profile = session.profile!,
    navigate = useNavigate(),
    [params] = useSearchParams();
  const catalog = useResource(() => api.catalog(), "catalog");
  const [error, setError] = useState<Error | null>(null),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [nickname, setNickname] = useState(profile.user.nickname);
  if (catalog.loading) return <Loading />;
  if (catalog.error)
    return <ErrorNotice error={catalog.error} retry={catalog.reload} />;
  const selectedArtists = catalog.data!.artists.filter((a) =>
      profile.taste.artists.includes(a.id),
    ),
    selectedTracks = catalog.data!.tracks.filter((t) =>
      profile.taste.tracks.includes(t.id),
    );
  const update = async (
    action: () => Promise<unknown>,
    destination?: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await session.refresh();
      if (destination) navigate(destination, { replace: true });
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Heading
        id={view === "result" ? "S08" : view === "solo" ? "S24" : "S14"}
        label={view === "solo" ? "MY OWN FREQUENCY" : "THE SOUND OF YOU"}
        title={
          view === "result" ? (
            <>
              당신의 취향은,
              <br />
              이런 모습.
            </>
          ) : view === "solo" ? (
            <>
              누구와 비교하지 않아도,
              <br />
              충분히 당신다운.
            </>
          ) : (
            <>나를 닮은 주파수.</>
          )
        }
        description={
          view === "solo"
            ? "사용자가 한 명이어도, 좋아하는 음악의 조각들은 선명해요."
            : "직접 선택한 음악과 태그로 만든 기본 취향 프로필입니다."
        }
      />
      {error && <ErrorNotice error={error} />}
      <div className="taste-page">
        <section className="taste-id" data-reveal>
          <span className="micro">
            TUNIT TASTE ID / {profile.user.nickname}
          </span>
          <div className="taste-flower">✳</div>
          <p className="micro">YOUR MUSIC PERSONALITY</p>
          <h2>
            {profile.taste.moods.includes("그루비한")
              ? "도시의 리듬 수집가"
              : profile.taste.moods.includes("차분한")
                ? "고요한 리스너"
                : "취향의 탐험가"}
          </h2>
          <p>
            {profile.taste.moods.length
              ? profile.taste.moods.join(" · ")
              : "아직 채워지지 않은 취향"}
          </p>
          <div className="tag-row">
            {profile.taste.genres.map((g) => (
              <Tag key={g}>{g}</Tag>
            ))}
          </div>
          <div className="taste-id-bottom">
            <Wordmark />
            <span>
              {profile.taste.public ? "PUBLIC TASTE" : "PRIVATE TASTE"}
            </span>
          </div>
        </section>
        <section className="taste-details">
          <p className="eyebrow">YOUR SOUND DNA</p>
          <h2>취향을 이루는 조각들</h2>
          <div className="taste-stats">
            <div>
              <strong>{selectedArtists.length}</strong>
              <span>아티스트</span>
            </div>
            <div>
              <strong>{selectedTracks.length}</strong>
              <span>좋아하는 곡</span>
            </div>
            <div>
              <strong>{profile.taste.genres.length}</strong>
              <span>장르</span>
            </div>
          </div>
          <div className="taste-artists">
            <p className="eyebrow">ALWAYS IN YOUR PLAYLIST</p>
            <div className="tag-row">
              {selectedArtists.map((a) => (
                <Tag key={a.id}>{a.name}</Tag>
              ))}
            </div>
          </div>
          <p className="sample-note">
            프로필 이름은 선택한 태그를 요약한 표현입니다. AI 추론이나 통계적
            확률을 의미하지 않습니다.
          </p>
          {view === "result" ? (
            <Link className="button" to={safeReturn(params.get("next"))}>
              {params.get("next") && params.get("next") !== "/home"
                ? "친구 초대로 돌아가기"
                : "Home으로 가기"}
              <Icon name="arrow" />
            </Link>
          ) : (
            <Link className="button" to="/music">
              나의 음악 만나기
              <Icon name="arrow" />
            </Link>
          )}
          <Link className="text-link" to="/onboarding/artists">
            취향 다시 고르기
            <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
      <section className="taste-songs">
        <div className="section-head">
          <div>
            <p className="eyebrow">YOUR MUSIC COLLECTION</p>
            <h2>나를 이루는 노래들</h2>
          </div>
        </div>
        {selectedTracks.map((t, i) => (
          <SongRow key={t.id} track={t} index={i} />
        ))}
        {!selectedTracks.length && (
          <p className="empty-state">아직 선택한 곡이 없어요.</p>
        )}
      </section>
      {view === "my" && (
        <section className="privacy-section">
          <h2>내 취향, 내가 정하는 범위.</h2>
          <label className="privacy-option">
            <span>
              <strong>내 취향 프로필 공개</strong>
              <small>
                끄면 다른 사용자의 추천·친구 비교에서 즉시 제외됩니다.
              </small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={profile.taste.public}
              disabled={busy}
              onChange={(e) =>
                void update(() =>
                  api.saveTaste({ ...profile.taste, public: e.target.checked }),
                )
              }
            />
          </label>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              void update(() => api.updateNickname(nickname));
            }}
          >
            <label>
              닉네임
              <input
                name="nickname"
                value={nickname}
                maxLength={12}
                required
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              이름 저장
              <Icon name="check" size={16} />
            </button>
          </form>
          <div className="action-row">
            <Link className="button" to="/onboarding/artists">
              취향 수정·재분석
              <Icon name="arrow" />
            </Link>
            <Link className="button secondary" to="/invite">
              친구 초대
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="danger-zone">
            <button
              className="text-link"
              onClick={() => setConfirm(!confirm)}
              aria-expanded={confirm}
            >
              내 취향 삭제
            </button>
            {confirm && (
              <div className="flow-notice">
                <p>
                  선택한 아티스트·곡·무드와 공개 설정이 삭제됩니다. 계정과 관심
                  요청 기록은 유지합니다.
                </p>
                <div className="action-row">
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      void update(() => api.deleteTaste(), "/onboarding/intro")
                    }
                  >
                    취향 삭제 확인
                    <Icon name="close" size={16} />
                  </button>
                  <button
                    className="text-link"
                    onClick={() => setConfirm(false)}
                  >
                    돌아가기
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className="text-link logout-button"
            disabled={busy}
            onClick={() => void update(() => session.logout())}
          >
            로그아웃
            <Icon name="arrow" size={16} />
          </button>
        </section>
      )}
    </>
  );
}
