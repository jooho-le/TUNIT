import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiMode } from "../../api";
import { useSession } from "../../app/Session";
import { useResource } from "../../hooks/useResource";
import {
  Heading,
  Loading,
  ErrorNotice,
  Empty,
} from "../../components/Feedback";
import { Icon } from "../../components/ui";
import { CopyLink, inviteUrl } from "../invitations/Invitations";

export function Follow() {
  const { userId = "" } = useParams(),
    session = useSession(),
    resource = useResource(() => api.match(userId), userId),
    [followed, setFollowed] = useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(`tunit-follow-${session.user!.id}`) || "[]",
        ).includes(userId);
      } catch {
        return false;
      }
    }),
    [error, setError] = useState<Error | null>(null);
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorNotice error={resource.error} />;
  return (
    <>
      <Heading
        id="S17"
        label="KEEP THIS FREQUENCY CLOSE / P1"
        title={
          <>
            {resource.data!.user.nickname}님의
            <br />
            다음 취향도 궁금하다면.
          </>
        }
        description="팔로우는 관심 요청과 별개입니다. 서로 연결되는 기능은 아닙니다."
      />
      {error && <ErrorNotice error={error} />}
      <button
        className="button"
        disabled={apiMode !== "mock"}
        aria-pressed={followed}
        onClick={() => {
          try {
            const key = `tunit-follow-${session.user!.id}`,
              list: string[] = JSON.parse(localStorage.getItem(key) || "[]");
            localStorage.setItem(
              key,
              JSON.stringify(
                followed
                  ? list.filter((id) => id !== userId)
                  : [...new Set([...list, userId])],
              ),
            );
            setFollowed(!followed);
          } catch {
            setError(new Error("팔로우 상태를 저장하지 못했습니다."));
          }
        }}
      >
        {followed ? "팔로우 해제" : "팔로우"}
        <Icon name={followed ? "check" : "plus"} />
      </button>
      <p className="sample-note">
        P1 프론트 UI입니다. 로컬 모드에서만 저장하며, 실제 팔로우 API 계약은
        추후 연결합니다.
      </p>
      <Link className="text-link" to={`/people/${userId}`}>
        프로필로 돌아가기
      </Link>
    </>
  );
}
export function Share() {
  const { userId = "" } = useParams(),
    { profile } = useSession(),
    resource = useResource(() => api.match(userId), userId),
    [consent, setConsent] = useState(false),
    [url, setUrl] = useState(""),
    [error, setError] = useState<Error | null>(null),
    [busy, setBusy] = useState(false);
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorNotice error={resource.error} />;
  return (
    <>
      <Heading
        id="S18"
        label="A TASTE WORTH SHARING / P1"
        title={
          <>
            우리의 공통점,
            <br />한 장에 담아서.
          </>
        }
        description="공개를 허용한 닉네임·취향만 표시합니다. 링크에는 비공개 취향을 넣지 않습니다."
      />
      {!profile!.taste.public ? (
        <Empty title="공개 범위를 먼저 정해 주세요.">
          <p>내 취향이 비공개인 동안에는 공유 카드를 만들지 않습니다.</p>
          <Link className="text-link" to="/my">
            공개 설정으로
          </Link>
        </Empty>
      ) : (
        <>
          <div className="share-card">
            <span className="eyebrow">TUNIT / OUR FREQUENCY</span>
            <h2>
              {profile!.user.nickname}
              <br />& {resource.data!.user.nickname}
            </h2>
            <strong>
              {resource.data!.score}
              <span>%</span>
            </strong>
            <p>
              {resource.data!.commonTracks.length}개의 공통곡 ·{" "}
              {resource.data!.commonArtists.length}명의 공통 아티스트
            </p>
          </div>
          {error && <ErrorNotice error={error} />}
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              위 공개 정보의 공유와 친구 초대용 링크 생성에 동의합니다.
            </span>
          </label>
          <button
            className="button"
            disabled={!consent || busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const invitation = await api.createInvitation(consent);
                setUrl(inviteUrl(invitation.token));
              } catch (e) {
                setError(e as Error);
              } finally {
                setBusy(false);
              }
            }}
          >
            공유·초대 링크 준비
            <Icon name="external" size={16} />
          </button>
          {url && <CopyLink url={url} />}
        </>
      )}
    </>
  );
}
export function Roadmap({ kind }: { kind: "chat" | "playlist" | "feed" }) {
  const { connectionId } = useParams(),
    connections = useResource(() => api.connections(), "connections");
  if (connections.loading) return <Loading />;
  if (connections.error) return <ErrorNotice error={connections.error} />;
  const connection = connections.data!.find((c) => c.id === connectionId);
  if (kind !== "feed" && !connection)
    return (
      <Empty title="상호 연결 후에 열리는 화면입니다.">
        <p>수락된 연결이 없는 대화나 공동 목록에는 접근할 수 없습니다.</p>
        <Link className="button" to="/connections">
          내 연결 확인
          <Icon name="arrow" />
        </Link>
      </Empty>
    );
  const details = {
    chat: {
      id: "S21",
      title: "음악에서 시작되는 대화.",
      description: "연결된 사용자끼리의 음악 대화는 P2 확장 범위입니다.",
    },
    playlist: {
      id: "S22",
      title: "둘이 채워갈 플레이리스트.",
      description: "곡 공동 추가·관리는 P2 확장 범위입니다.",
    },
    feed: {
      id: "S23",
      title: "누군가의 오늘을 듣다.",
      description:
        "음악 피드는 P2 확장 범위입니다. 가짜 게시물을 생성하지 않습니다.",
    },
  }[kind];
  return (
    <>
      <Heading
        id={details.id}
        label="NEXT FREQUENCY / P2"
        title={details.title}
        description={details.description}
      />
      <Empty title="다음 단계에서 만나요.">
        <p>
          {connection
            ? `${connection.partner.nickname}님과의 연결은 완료됐어요. `
            : ""}
          현재는 취향 탐색·친구 비교·관심 요청의 핵심 흐름에 집중합니다.
        </p>
        <div className="action-row">
          {kind === "chat" && (
            <Link className="text-link" to={`/playlist/${connectionId}`}>
              공동 플레이리스트 안내
            </Link>
          )}
          <Link className="button" to="/music">
            음악 발견으로
            <Icon name="arrow" />
          </Link>
          <Link className="text-link" to="/home">
            Home으로
          </Link>
        </div>
      </Empty>
    </>
  );
}
