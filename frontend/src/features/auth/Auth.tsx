import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, apiMode } from "../../api";
import { useSession } from "../../app/Session";
import { Heading, ErrorNotice } from "../../components/Feedback";
import { Icon } from "../../components/ui";

import { safeReturn } from "./returnTo";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [email, setEmail] = useState(""),
    [nickname, setNickname] = useState(""),
    [password, setPassword] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Error | null>(null);
  const session = useSession(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const next = safeReturn(params.get("next"));
  return (
    <section className="focused-view auth-page">
      <Heading
        id="S02"
        label="YOUR MUSIC STARTS HERE"
        title={
          next !== "/home" ? (
            <>
              친구가 보낸 초대.
              <br />
              취향으로 답해볼까요?
            </>
          ) : (
            <>
              좋아하는 음악이,
              <br />
              우리의 시작.
            </>
          )
        }
      />
      <div className="segmented" role="group" aria-label="가입 또는 로그인">
        <button
          aria-pressed={mode === "login"}
          onClick={() => {
            setMode("login");
            setError(null);
          }}
        >
          로그인
        </button>
        <button
          aria-pressed={mode === "signup"}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
        >
          회원가입
        </button>
      </div>
      {error && <ErrorNotice error={error} />}
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError(null);
          try {
            if (mode === "signup")
              await api.signup({ email, nickname, password });
            await api.login({ email, password });
            setPassword("");
            await session.refresh();
            const profile = await api.profile();
            navigate(
              profile.complete
                ? next
                : `/onboarding/intro?next=${encodeURIComponent(next)}`,
              { replace: true },
            );
          } catch (e) {
            setError(e as Error);
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "signup" && (
          <label>
            닉네임
            <input
              name="nickname"
              autoComplete="nickname"
              value={nickname}
              maxLength={12}
              required
              onChange={(e) => setNickname(e.target.value)}
              placeholder="당신을 부를 이름"
            />
          </label>
        )}
        <label>
          이메일
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          비밀번호
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상"
          />
        </label>
        {mode === "signup" && (
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <span>
              {apiMode === "mock"
                ? "로컬 체험 안내를 확인했습니다. 계정과 취향은 현재 브라우저에 저장됩니다."
                : "서비스 이용 안내와 개인정보 처리 안내를 확인했습니다."}
            </span>
          </label>
        )}
        <button
          className="button"
          type="submit"
          disabled={busy || (mode === "signup" && !consent)}
        >
          {busy
            ? "확인하는 중…"
            : mode === "signup"
              ? "내 취향으로 시작하기"
              : "이어 듣기"}
          <Icon name="arrow" />
        </button>
      </form>
      <details className="auth-notice">
        <summary>이용 안내</summary>
        <p>
          {apiMode === "mock"
            ? "로컬 데모 계정은 이 기기에만 존재합니다. 비밀번호 원문은 저장하지 않으며 브라우저용 단방향 값으로 확인합니다. 실제 Spring Security·HttpOnly 세션 인증과는 별개입니다. 실제 서비스에서 사용하는 비밀번호는 입력하지 마세요."
            : "계정 정보는 같은 출처의 Spring API로 전송하며, HttpOnly 세션 쿠키와 CSRF 보호를 사용합니다. 서버에 설정된 공개 범위 안에서만 취향을 비교합니다."}
        </p>
      </details>
      <Link className="text-link" to="/landing">
        처음으로 <Icon name="back" size={16} />
      </Link>
    </section>
  );
}
