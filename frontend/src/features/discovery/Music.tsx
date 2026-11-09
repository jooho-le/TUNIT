import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useResource } from "../../hooks/useResource";
import { Art, Icon } from "../../components/ui";
import {
  Heading,
  Empty,
  ErrorNotice,
  Loading,
} from "../../components/Feedback";
import { SongRow, musicUrl } from "../../components/SongRow";

export function Music() {
  const resource = useResource(() => api.discovery(), "discovery"),
    [query, setQuery] = useState(""),
    [help, setHelp] = useState(false);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const items = resource.data!.filter((t) =>
      `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()),
    ),
    featured = items[0];
  return (
    <>
      <Heading
        id="S13"
        label="YOUR NEXT FAVORITE"
        title={
          <>
            누군가의 취향에서,
            <br />
            나의 다음 곡으로.
          </>
        }
        description="공개한 사용자의 곡과 직접 등록한 음악을 탐색합니다."
      />
      {featured && (
        <section className="music-feature">
          <Art art={featured.art} />
          <div className="music-feature-copy">
            <span className="pill">PICK A FREQUENCY</span>
            <h2>{featured.title}</h2>
            <p>{featured.artist}</p>
            <a
              className="button"
              href={musicUrl(featured)}
              target="_blank"
              rel="noopener noreferrer"
            >
              외부 음악 서비스에서 듣기
              <Icon name="external" size={17} />
            </a>
          </div>
        </section>
      )}
      <label className="search-field">
        <Icon name="search" />
        <input
          name="music-search"
          aria-label="곡 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 또는 아티스트 검색"
        />
      </label>
      <div className="music-list">
        {items.map((t, i) => (
          <SongRow key={t.id} track={t} index={i} />
        ))}
      </div>
      {!items.length && (
        <Empty title="아직 탐색할 곡이 없어요.">
          <p>취향에 음악을 등록하거나 다른 검색어를 사용해 주세요.</p>
          <Link className="text-link" to="/my">
            내 취향 보완하기
          </Link>
        </Empty>
      )}
      <button
        className="text-link music-help"
        aria-expanded={help}
        onClick={() => setHelp(!help)}
      >
        외부 링크가 열리지 않나요?
      </button>
      {help && (
        <div className="flow-notice" role="status">
          <p>
            외부 앱·브라우저의 링크 설정을 확인해 주세요. 음악 목록은 그대로
            유지됩니다.
          </p>
          {featured && (
            <label>
              외부 음악 검색 주소
              <input
                aria-label="외부 음악 검색 주소"
                readOnly
                value={musicUrl(featured)}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
          <button className="text-link" onClick={() => setHelp(false)}>
            목록으로 돌아가기
          </button>
        </div>
      )}
      <p className="sample-note">
        재생 권한을 가진 외부 서비스로 연결합니다. 앱 안에서 음원을 재생하거나
        무단 수집하지 않습니다.
      </p>
    </>
  );
}
