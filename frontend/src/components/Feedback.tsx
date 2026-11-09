import { Link } from "react-router-dom";
import { ApiError } from "../api";
import { Icon } from "./ui";
import type { ReactNode } from "react";
export function Heading({
  id,
  label,
  title,
  description,
  children,
}: {
  id: string;
  label: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-greeting" data-screen={id}>
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="resource-loading" role="status">
      <span>✳</span>
      <p>취향의 주파수를 맞추는 중입니다.</p>
    </div>
  );
}
export function ErrorNotice({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  const code = error instanceof ApiError ? error.status : null;
  return (
    <section className="flow-notice" role="alert">
      <strong>
        {code === 401
          ? "다시 로그인해 주세요."
          : code === 403
            ? "공개 범위와 권한을 확인해 주세요."
            : code === 409
              ? "최신 상태를 확인해 주세요."
              : "잠시 멈췄어요."}
      </strong>
      <p>{error.message}</p>
      <div className="action-row">
        {retry && (
          <button className="text-link" onClick={retry}>
            새로 확인하기 <Icon name="arrow" size={16} />
          </button>
        )}
        {code === 401 ? (
          <Link className="text-link" to="/login">
            로그인으로
          </Link>
        ) : (
          <Link className="text-link" to="/home">
            Home으로
          </Link>
        )}
      </div>
    </section>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flow-empty">
      <span className="empty-flower" aria-hidden="true">
        ✳
      </span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
