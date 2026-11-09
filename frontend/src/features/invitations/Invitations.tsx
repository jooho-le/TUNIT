import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiMode } from "../../api";
import { useSession } from "../../app/Session";
import { useResource } from "../../hooks/useResource";
import { Heading, ErrorNotice, Loading } from "../../components/Feedback";
import { Icon } from "../../components/ui";
import { MatchDetail } from "../matching/Person";

export const inviteUrl = (token: string) =>
  `${window.location.origin}${window.location.pathname}#/invite/${encodeURIComponent(token)}`;
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <div className="share-link">
      <label>
        친구 초대 링크
        <input
          aria-label="친구 초대 링크"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
        />
      </label>
      <button
        className="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {copied ? "복사했어요" : "링크 복사"}
        <Icon name="external" size={16} />
      </button>
      {failed && (
        <p role="status">
          자동 복사를 사용할 수 없습니다. 링크 입력란을 선택해 직접 복사해
          주세요.
        </p>
      )}
    </div>
  );
}
export function InvitationCreate() {
  const { profile } = useSession(),
    navigate = useNavigate(),
    [consent, setConsent] = useState(false),
    [error, setError] = useState<Error | null>(null),
    [busy, setBusy] = useState(false);
  return (
    <>
      <Heading
        id="S25"
        label="A FRIEND, A NEW FREQUENCY"
        title={
          <>
            알던 친구,
            <br />
            몰랐던 취향.
          </>
        }
        description="친구가 가입하고 취향을 완성하면 둘만의 공통점을 발견할 수 있어요."
      />
      <div className="invite-stage">
        <div className="preview-orbits large-orbits" aria-hidden="true">
          <i />
          <i />
        </div>
        <h2>
          각자의 노래가,
          <br />
          우리의 플레이리스트로.
        </h2>
        <ol className="invite-steps">
          <li>초대 링크 보내기</li>
          <li>친구 가입·취향 입력</li>
          <li>양쪽 동의 후 1:1 비교</li>
        </ol>
        {error && <ErrorNotice error={error} />}{" "}
        {!profile?.taste.public ? (
          <div className="flow-notice">
            <p>친구와 비교하려면 먼저 내 취향 공개를 켜주세요.</p>
            <Link className="text-link" to="/my">
              공개 설정으로
            </Link>
          </div>
        ) : (
          <>
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                공개한 취향을 초대받은 친구와 1:1 비교하는 데 동의해요.
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
                  navigate(`/invite/${invitation.token}`);
                } catch (e) {
                  setError(e as Error);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "초대 준비 중…" : "친구 초대 링크 만들기"}
              <Icon name="arrow" />
            </button>
          </>
        )}
        <p className="sample-note">
          {apiMode === "mock"
            ? "로컬 데모 초대는 24시간 유효하며 같은 브라우저 저장소의 테스트 계정끼리 확인할 수 있습니다. 다른 기기 연결은 Spring API 연동 후 가능합니다."
            : "유효기간은 서버가 발급한 초대 정보를 따릅니다."}
        </p>
      </div>
    </>
  );
}

export function InvitationStatus() {
  const { token = "" } = useParams(),
    session = useSession(),
    navigate = useNavigate(),
    resource = useResource(() => api.invitation(token), token),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Error | null>(null);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const invite = resource.data!,
    mine = session.user?.id === invite.inviterId;
  const next = `/invite/${token}`;
  return (
    <>
      <Heading
        id="S25"
        label="INVITATION / WAITING FOR YOUR FRIEND"
        title={
          invite.status === "EXPIRED" ? (
            <>잠시 지나간 초대.</>
          ) : invite.status === "READY" ? (
            <>
              둘의 취향이,
              <br />
              이제 준비됐어요.
            </>
          ) : (
            <>
              {invite.inviterName}님이
              <br />
              취향을 건넸어요.
            </>
          )
        }
        description={
          invite.status === "EXPIRED"
            ? "링크가 만료되어 비교 정보를 표시하지 않습니다."
            : "친구의 가입·프로필 완성·비교 동의를 확인한 뒤에만 결과가 열립니다."
        }
      />
      <section className="invitation-status">
        <span className={`status-pill ${invite.status.toLowerCase()}`}>
          {
            {
              WAITING: "친구 참여 대기",
              NEEDS_PROFILE: "취향 입력 대기",
              NEEDS_CONSENT: "양쪽 공개·동의 필요",
              READY: "비교 준비 완료",
              EXPIRED: "만료된 초대",
            }[invite.status]
          }
        </span>
        {error && <ErrorNotice error={error} />}{" "}
        {invite.status === "EXPIRED" ? (
          <Link className="button" to="/invite">
            새 초대 만들기
            <Icon name="arrow" />
          </Link>
        ) : !session.user ? (
          <Link
            className="button"
            to={`/login?next=${encodeURIComponent(next)}`}
          >
            가입·로그인하고 참여
            <Icon name="arrow" />
          </Link>
        ) : !session.profile?.complete ? (
          <Link
            className="button"
            to={`/onboarding/intro?next=${encodeURIComponent(next)}`}
          >
            취향 완성하고 초대로 돌아오기
            <Icon name="arrow" />
          </Link>
        ) : invite.status === "READY" ? (
          <Link className="button" to={`/friends/${token}`}>
            친구와 1:1 궁합 보기
            <Icon name="arrow" />
          </Link>
        ) : mine ? (
          <>
            <p>
              친구가 초대 링크로 참여하고 취향을 완성할 때까지 기다려 주세요.
            </p>
            <CopyLink url={inviteUrl(token)} />
          </>
        ) : (
          <>
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                내 공개 취향을 {invite.inviterName}님과 비교하는 데 동의해요.
              </span>
            </label>
            {!session.profile.taste.public && (
              <Link className="text-link" to="/my">
                먼저 내 취향 공개 켜기
              </Link>
            )}
            <button
              className="button"
              disabled={busy || !consent || !session.profile.taste.public}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const result = await api.acceptInvitation(token, consent);
                  if (result.status === "READY") navigate(`/friends/${token}`);
                  else resource.reload();
                } catch (e) {
                  setError(e as Error);
                } finally {
                  setBusy(false);
                }
              }}
            >
              비교에 참여하기
              <Icon name="arrow" />
            </button>
          </>
        )}
        <div className="invitation-meta">
          <span>유효 기한</span>
          <time>
            {new Intl.DateTimeFormat("ko-KR", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Seoul",
            }).format(new Date(invite.expiresAt))}{" "}
            KST
          </time>
        </div>
        <button className="text-link" onClick={resource.reload}>
          참여 상태 다시 확인
          <Icon name="arrow" size={16} />
        </button>
        {invite.status !== "EXPIRED" &&
          mine &&
          !session.profile?.taste.public && (
            <p className="sample-note">
              비교를 준비하려면 My Taste에서 공개 설정을 확인해 주세요.
            </p>
          )}
        <p className="sample-note">
          초대 상대가 준비되기 전에는 상대의 개인 취향과 비교 점수를 표시하지
          않습니다.
        </p>
      </section>
    </>
  );
}

export function FriendComparison() {
  const { token = "" } = useParams(),
    resource = useResource(() => api.compareInvitation(token), token);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return (
      <>
        <ErrorNotice error={resource.error} retry={resource.reload} />
        <Link className="text-link" to={`/invite/${token}`}>
          초대 상태로 돌아가기
        </Link>
      </>
    );
  return (
    <>
      <MatchDetail match={resource.data!} friend />
      <Link className="text-link back-link" to="/invite">
        다른 친구 초대하기
        <Icon name="arrow" />
      </Link>
    </>
  );
}
