import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { useResource } from "../../hooks/useResource";
import {
  Heading,
  ErrorNotice,
  Loading,
  Empty,
} from "../../components/Feedback";
import { Art, Icon } from "../../components/ui";

const statuses = {
  PENDING: "대기 중",
  ACCEPTED: "수락됨",
  REJECTED: "거절됨",
  CANCELLED: "취소됨",
};
export function InterestCompose() {
  const { userId = "" } = useParams(),
    navigate = useNavigate(),
    resource = useResource(() => api.match(userId), userId),
    [note, setNote] = useState(""),
    [error, setError] = useState<Error | null>(null),
    [busy, setBusy] = useState(false);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const match = resource.data!;
  return (
    <>
      <Heading
        id="S15"
        label="SAY HELLO WITH YOUR TASTE"
        title={
          <>
            같이 좋아하는 곡으로,
            <br />
            가볍게 안녕.
          </>
        }
        description="상대에게 관심을 보내면 받은 요청 목록에 표시됩니다."
      />
      <div className="interest-compose">
        <div className="recipient-preview">
          <Art art="ocean" />
          <div>
            <p className="eyebrow">TO</p>
            <h2>{match.user.nickname}</h2>
            <p>{match.commonTracks.length}개의 공통곡</p>
          </div>
        </div>
        {error && <ErrorNotice error={error} />}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api.sendInterest(userId, note);
              navigate("/interests/sent");
            } catch (e) {
              setError(e as Error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            음악으로 건네는 한마디 <span>선택</span>
            <textarea
              name="interest-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={140}
              rows={4}
              placeholder="이 곡을 좋아하는 사람을 만나서 반가워요."
            />
          </label>
          <div className="composer-count">{note.length} / 140</div>
          <div className="action-row">
            <button className="button" disabled={busy} type="submit">
              {busy ? "보내는 중…" : "관심 요청 보내기"}
              <Icon name="heart" size={18} />
            </button>
            <Link className="text-link" to={`/people/${userId}`}>
              프로필로 돌아가기
            </Link>
          </div>
        </form>
        <p className="sample-note">
          본인·중복·권한·요청 상태를 확인합니다. 거절된 작업은 기존 요청을
          변경하지 않습니다.
        </p>
      </div>
    </>
  );
}

export function InterestList({ kind }: { kind: "inbox" | "sent" }) {
  const navigate = useNavigate(),
    resource = useResource(() => api.interests(kind), kind),
    [error, setError] = useState<Error | null>(null),
    [busy, setBusy] = useState("");
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const act = async (id: string, action: "accept" | "reject" | "cancel") => {
    setBusy(id);
    setError(null);
    try {
      await api.actOnInterest(id, action);
      if (action === "accept") navigate("/connections");
      else navigate("/discover");
    } catch (e) {
      setError(e as Error);
      resource.reload();
    } finally {
      setBusy("");
    }
  };
  return (
    <>
      <Heading
        id={kind === "inbox" ? "S19" : "S16"}
        label={
          kind === "inbox" ? "A LITTLE HELLO FOR YOU" : "YOUR TASTE, ON ITS WAY"
        }
        title={
          kind === "inbox" ? (
            <>
              누군가의 취향이,
              <br />
              당신에게 닿았어요.
            </>
          ) : (
            <>내가 건넨 주파수.</>
          )
        }
        description={
          kind === "inbox"
            ? "수신자만 대기 중인 요청을 수락하거나 거절할 수 있습니다."
            : "아직 수락되지 않은 요청은 보낸 사람이 취소할 수 있습니다."
        }
      />
      <div className="segmented request-tabs">
        <Link
          aria-current={kind === "inbox" ? "page" : undefined}
          to="/interests/inbox"
        >
          받은 요청
        </Link>
        <Link
          aria-current={kind === "sent" ? "page" : undefined}
          to="/interests/sent"
        >
          보낸 요청
        </Link>
      </div>
      {error && <ErrorNotice error={error} retry={resource.reload} />}
      <div className="request-list">
        {resource.data!.map((r) => (
          <article className="request-card" key={r.id}>
            <div className="request-person">
              <span className="request-avatar">
                {(kind === "inbox" ? r.senderName : r.recipientName).slice(
                  0,
                  1,
                )}
              </span>
              <div>
                <Link
                  to={`/people/${kind === "inbox" ? r.senderId : r.recipientId}`}
                >
                  {kind === "inbox" ? r.senderName : r.recipientName}
                </Link>
                <small>
                  {new Intl.DateTimeFormat("ko-KR", {
                    dateStyle: "medium",
                    timeZone: "Asia/Seoul",
                  }).format(new Date(r.createdAt))}
                </small>
              </div>
              <span className={`status-pill ${r.status.toLowerCase()}`}>
                {statuses[r.status]}
              </span>
            </div>
            {r.note && <p className="request-note">“{r.note}”</p>}
            <div className="request-actions">
              {r.status === "PENDING" ? (
                kind === "inbox" ? (
                  <>
                    <button
                      className="button"
                      disabled={!!busy}
                      onClick={() => void act(r.id, "accept")}
                    >
                      수락
                      <Icon name="check" size={16} />
                    </button>
                    <button
                      className="text-link"
                      disabled={!!busy}
                      onClick={() => void act(r.id, "reject")}
                    >
                      거절
                    </button>
                  </>
                ) : (
                  <button
                    className="text-link"
                    disabled={!!busy}
                    onClick={() => void act(r.id, "cancel")}
                  >
                    관심 요청 취소
                    <Icon name="close" size={16} />
                  </button>
                )
              ) : r.status === "ACCEPTED" ? (
                <Link className="text-link" to="/connections">
                  연결 확인
                  <Icon name="arrow" size={16} />
                </Link>
              ) : (
                <span className="sample-note">처리가 완료된 요청입니다.</span>
              )}
            </div>
          </article>
        ))}
      </div>
      {!resource.data!.length && (
        <Empty
          title={
            kind === "inbox"
              ? "아직 도착한 관심이 없어요."
              : "아직 건넨 관심이 없어요."
          }
        >
          <p>취향이 맞는 사람을 만나면 가볍게 인사해 보세요.</p>
          <Link className="button" to="/discover">
            Music Twin 찾아보기
            <Icon name="arrow" />
          </Link>
        </Empty>
      )}
      <button className="text-link" onClick={resource.reload}>
        최신 상태 확인
        <Icon name="arrow" size={16} />
      </button>
    </>
  );
}

export function Connections() {
  const resource = useResource(() => api.connections(), "connections");
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  return (
    <>
      <Heading
        id="S20"
        label="YOUR FREQUENCIES, CONNECTED"
        title={
          <>
            같은 노래에서,
            <br />
            우리는 연결됐어요.
          </>
        }
        description="관심 요청이 수락된 연결만 표시합니다."
      />
      <div className="connection-list">
        {resource.data!.map((c) => (
          <article className="connection-card" key={c.id}>
            <span className="connection-symbol">✳</span>
            <div>
              <span className="status-pill accepted">ACCEPTED</span>
              <h2>{c.partner.nickname}</h2>
              <p>서로의 취향에 마음이 닿았어요.</p>
            </div>
            <div className="action-stack">
              <Link className="button" to={`/people/${c.partner.id}`}>
                공개 프로필 보기
                <Icon name="arrow" />
              </Link>
              <Link className="text-link" to={`/chat/${c.id}`}>
                음악 대화 <span className="phase-tag">P2 준비중</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!resource.data!.length && (
        <Empty title="아직 함께 듣는 사람이 없어요.">
          <p>관심을 주고받고 수락하면 새로운 연결이 시작됩니다.</p>
          <Link className="button" to="/interests/inbox">
            받은 관심 보기
            <Icon name="arrow" />
          </Link>
        </Empty>
      )}
    </>
  );
}
