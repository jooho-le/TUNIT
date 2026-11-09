import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useResource } from "../../hooks/useResource";
import { Art, Icon, Tag } from "../../components/ui";
import { Heading, ErrorNotice, Loading } from "../../components/Feedback";
import { SongRow } from "../../components/SongRow";
import type { Match } from "../../types";

export function MatchDetail({
  match,
  friend = false,
}: {
  match: Match;
  friend?: boolean;
}) {
  return (
    <>
      <Heading
        id={friend ? "S27" : "S12"}
        label={friend ? "A FRIEND, A NEW FREQUENCY" : "SHARED FREQUENCIES"}
        title={
          <>
            우리 사이의 <span className="yellow">교집합.</span>
          </>
        }
        description={`${match.user.nickname}님과 함께 좋아하는 것, 그리고 새롭게 알게 될 것.`}
      />
      <section className="venn-section">
        <div className="venn-circle left">
          <span>나</span>
        </div>
        <div className="venn-circle right">
          <span>{match.user.nickname}</span>
        </div>
        <div className="venn-center">
          <Icon name="headphones" size={28} />
          <strong>
            {match.score}
            <small>%</small>
          </strong>
          <span>입력 기반 취향 유사도</span>
        </div>
      </section>
      <p className="comparison-reason">{match.reason}</p>
      <div className="match-bottom">
        <section>
          <p className="eyebrow">OUR COMMON GROUND</p>
          <h2>함께 좋아하는 아티스트</h2>
          {match.commonArtists.length ? (
            <div className="common-artists">
              {match.commonArtists.map((a) => (
                <div key={a.id}>
                  <Art art={a.art} />
                  <span>{a.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sample-note">직접 겹치는 아티스트는 아직 없어요.</p>
          )}
          <h2>함께 좋아하는 곡</h2>
          {match.commonTracks.length ? (
            match.commonTracks.map((t, i) => (
              <SongRow key={t.id} track={t} index={i} />
            ))
          ) : (
            <p className="sample-note">직접 겹치는 곡은 아직 없어요.</p>
          )}
        </section>
        <section className="difference-card">
          <Icon name="spark" size={26} />
          <h2>
            조금 달라서,
            <br />더 궁금한 취향.
          </h2>
          <p>
            {match.differentArtists.map((a) => a.name).join(" · ") ||
              "선택한 아티스트는 모두 겹쳐요."}
          </p>
          {match.newTracks.map((t, i) => (
            <SongRow key={t.id} track={t} index={i} />
          ))}
          <div className="action-stack">
            <Link className="button" to="/music">
              새로운 음악 발견
              <Icon name="arrow" />
            </Link>
            <Link
              className="button secondary"
              to={`/interest/${match.user.id}`}
            >
              관심 보내기
              <Icon name="heart" size={18} />
            </Link>
            <Link className="text-link" to={`/share/${match.user.id}`}>
              궁합 카드 공유
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
export function Person({ compare = false }: { compare?: boolean }) {
  const { userId = "" } = useParams(),
    resource = useResource(() => api.match(userId), userId);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const match = resource.data!;
  if (compare)
    return (
      <>
        <Link className="text-link back-link" to={`/people/${userId}`}>
          <Icon name="back" size={17} />
          {match.user.nickname}의 프로필
        </Link>
        <MatchDetail match={match} />
      </>
    );
  return (
    <>
      <Link className="text-link back-link" to="/discover">
        <Icon name="back" size={17} />
        Discover
      </Link>
      <div className="profile-hero" data-screen="S11">
        <div className="profile-art">
          <Art art="ocean" />
          <span>{match.user.nickname.slice(0, 1)}</span>
          <i>✳</i>
        </div>
        <div className="profile-info">
          <p className="eyebrow">ON YOUR FREQUENCY</p>
          <h1>{match.user.nickname}</h1>
          <div className="tag-row">
            {[...match.genres, ...match.moods.slice(0, 1)].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <div className="profile-score">
            <strong>
              {match.score}
              <span>%</span>
            </strong>
            <div>
              <b>우리 취향의 교집합</b>
              <span>공개된 실제 취향만 비교</span>
            </div>
          </div>
          <p className="sample-note">{match.reason}</p>
          <div className="action-stack">
            <Link className="button" to={`/matches/${userId}`}>
              어떤 취향이 닮았을까?
              <Icon name="arrow" />
            </Link>
            <Link className="button secondary" to={`/interest/${userId}`}>
              관심 보내기
              <Icon name="heart" size={18} />
            </Link>
            <Link className="text-link" to={`/follow/${userId}`}>
              팔로우 <span className="phase-tag">P1</span>
            </Link>
          </div>
        </div>
      </div>
      <section className="profile-favorites">
        <h2>{match.user.nickname}님의 새로운 곡</h2>
        {match.newTracks.map((t, i) => (
          <SongRow key={t.id} track={t} index={i} />
        ))}
      </section>
    </>
  );
}
