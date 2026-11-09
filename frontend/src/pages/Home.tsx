import { Link } from "react-router-dom";
import { useSession } from "../app/Session";
import { api } from "../api";
import { useResource } from "../hooks/useResource";
import { Heading, Loading, ErrorNotice } from "../components/Feedback";
import { Icon, Tag } from "../components/ui";

export default function Home() {
  const { profile } = useSession();
  const data = useResource(
    () =>
      Promise.all([api.matches(), api.interests("inbox"), api.connections()]),
    "home",
  );
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorNotice error={data.error} retry={data.reload} />;
  const [matches, inbox, connections] = data.data!;
  const pending = inbox.filter((r) => r.status === "PENDING");
  return (
    <>
      <Heading
        id="S09"
        label="YOUR DAILY FREQUENCY"
        title={
          <>
            {profile!.user.nickname}님의 지금,
            <br />
            어떤 취향인가요<span className="yellow">?</span>
          </>
        }
        description="혼자 즐겨도, 누군가와 나눠도 좋은 음악. 오늘의 연결 방식을 골라보세요."
      />
      <div className="home-dashboard">
        <section className="dashboard-feature" data-reveal>
          <div className="dashboard-feature-copy">
            <p className="eyebrow">THE SOUND OF YOU</p>
            <h2>
              좋아하는 것들이,
              <br />
              나의 모양이 된다.
            </h2>
            <p>취향 입력은 끝났어요. 이제 당신의 음악을 만나볼 차례.</p>
            <Link className="button" to="/solo">
              혼자 취향 탐색
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="dashboard-flower" aria-hidden="true">
            ✳
          </div>
        </section>
        <section className="dashboard-taste" data-reveal>
          <p className="eyebrow">YOUR TASTE PROFILE</p>
          <h2>
            {profile!.taste.moods.includes("그루비한")
              ? "도시의 리듬 수집가"
              : "나만의 주파수"}
          </h2>
          <div className="tag-row">
            {[
              ...profile!.taste.genres,
              ...profile!.taste.moods.slice(0, 1),
            ].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <Link className="text-link" to="/my">
            내 취향 보기
            <Icon name="arrow" />
          </Link>
        </section>
      </div>
      <div className="journey-grid">
        <Link className="journey-card" to="/discover">
          <span>01 / MUSIC TWIN</span>
          <Icon name="headphones" size={30} />
          <h2>같은 음악을 듣는 사람.</h2>
          <p>
            {matches.length
              ? `지금 ${matches.length}명의 공개 취향이 기다리고 있어요.`
              : "아직 추천할 사람이 없어요. 당신의 취향부터 더 알아가 보세요."}
          </p>
          <strong>
            Music Twin 찾기 <Icon name="arrow" />
          </strong>
        </Link>
        <Link className="journey-card purple-card" to="/invite">
          <span>02 / FRIEND COMPARISON</span>
          <Icon name="heart" size={30} />
          <h2>알던 친구, 몰랐던 취향.</h2>
          <p>친구를 초대하고 둘만의 공통곡을 발견해 보세요.</p>
          <strong>
            친구와 비교하기 <Icon name="arrow" />
          </strong>
        </Link>
      </div>
      <div className="home-shortcuts">
        <Link to="/interests/inbox">
          <span>
            <strong>받은 관심 요청</strong>
            <small>
              {pending.length
                ? `${pending.length}개의 요청이 기다려요`
                : "아직 새 요청이 없어요"}
            </small>
          </span>
          <b>{pending.length.toString().padStart(2, "0")}</b>
        </Link>
        <Link to="/connections">
          <span>
            <strong>함께 듣는 사람들</strong>
            <small>{connections.length}명과 연결되어 있어요</small>
          </span>
          <Icon name="arrow" />
        </Link>
        <Link to="/interests/sent">
          <span>
            <strong>보낸 관심</strong>
            <small>대기·취소·처리 상태 확인</small>
          </span>
          <Icon name="arrow" />
        </Link>
      </div>
      <Link className="text-link roadmap-link" to="/feed">
        다음 주파수: 음악 피드 <span className="phase-tag">P2 준비중</span>
      </Link>
    </>
  );
}
