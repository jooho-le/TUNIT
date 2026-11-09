import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useResource } from "../../hooks/useResource";
import { Art, Icon, Tag } from "../../components/ui";
import {
  Heading,
  Empty,
  ErrorNotice,
  Loading,
} from "../../components/Feedback";

export function CandidateEmpty() {
  return (
    <>
      <Heading
        id="S26"
        label="MORE PEOPLE, MORE POSSIBILITIES"
        title={<>아직 닿지 않은 주파수.</>}
        description="아직 이곳에서 만날 수 있는 취향이 없어요. 당신의 음악부터 더 알아가 볼까요?"
      />
      <Empty title="연결이 없어도, 탐색은 계속.">
        <p>
          혼자 내 음악을 더 알아가거나,
          <br />
          친구를 초대해 1:1 궁합을 확인해 보세요.
        </p>
        <div className="action-row">
          <Link className="button" to="/solo">
            혼자 탐색
            <Icon name="arrow" />
          </Link>
          <Link className="button secondary" to="/invite">
            친구 초대
            <Icon name="arrow" />
          </Link>
          <Link className="text-link" to="/my">
            취향 보완·공개 설정
          </Link>
        </div>
      </Empty>
    </>
  );
}
export function Discover() {
  const resource = useResource(() => api.matches(), "matches"),
    [query, setQuery] = useState("");
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  if (!resource.data!.length) return <CandidateEmpty />;
  const filtered = resource.data!.filter((m) =>
    `${m.user.nickname} ${m.genres.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        id="S10"
        label="YOUR NEXT FAVORITE PERSON"
        title={
          <>
            같은 음악에,
            <br />
            마음이 움직이는 사람들<span className="yellow">.</span>
          </>
        }
        description={`현재 공개된 추천 후보 ${resource.data!.length}명. 실제 입력 취향만 비교합니다.`}
      />
      <div className="discover-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            name="people-search"
            aria-label="공개 프로필 검색"
            placeholder="이름이나 장르로 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Link className="text-link" to="/interests/sent">
          보낸 관심
          <Icon name="arrow" size={16} />
        </Link>
      </div>
      <div className="people-grid">
        {filtered.map((m, i) => (
          <Link
            className="person-card"
            key={m.user.id}
            to={`/people/${m.user.id}`}
          >
            <div className="person-image">
              <Art art={i % 2 ? "rose" : "ocean"} />
              <span className="portrait-orbit" />
              <span className="portrait-letter">
                {m.user.nickname.slice(0, 1)}
              </span>
              <span className="match-chip">{m.score}% TASTE</span>
              <span className="person-open">
                <Icon name="arrow" />
              </span>
            </div>
            <div className="person-meta">
              <div>
                <h3>{m.user.nickname}</h3>
                <p>{m.moods.slice(0, 2).join(" · ")}</p>
              </div>
              <div className="person-tags">
                {m.genres.slice(0, 2).map((g) => (
                  <Tag key={g}>{g}</Tag>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <Empty title="검색한 취향이 아직 없어요.">
          <button className="text-link" onClick={() => setQuery("")}>
            전체 후보 보기
          </button>
        </Empty>
      )}
      <p className="sample-note">
        점수는 입력한 음악·태그의 기본 유사도이며 관계 성공 확률이 아닙니다.
      </p>
    </>
  );
}
