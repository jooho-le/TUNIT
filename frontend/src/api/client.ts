import { ApiError } from "./types";

export function createHttpClient(
  base = import.meta.env.VITE_API_BASE_URL || "/api/v1",
) {
  if (!base.startsWith("/api/"))
    throw new Error("API 주소는 같은 출처의 /api/ 경로를 사용해야 합니다.");
  let csrf: { token: string; headerName: string } | null = null;
  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers);
    if (options.body) headers.set("Content-Type", "application/json");
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      if (!csrf) {
        let response: Response;
        try {
          response = await fetch(`${base}/auth/csrf`, {
            credentials: "include",
            cache: "no-store",
          });
        } catch {
          throw new ApiError(
            0,
            "서버에 연결할 수 없습니다. 입력 내용은 유지됩니다.",
            "NETWORK_ERROR",
          );
        }
        if (!response.ok)
          throw new ApiError(
            response.status,
            "보안 토큰을 가져오지 못했습니다. 다시 로그인해 주세요.",
            "CSRF_UNAVAILABLE",
          );
        const token = await response.json().catch(() => ({}));
        if (
          typeof token.token !== "string" ||
          !["X-XSRF-TOKEN", "X-CSRF-TOKEN"].includes(token.headerName)
        )
          throw new ApiError(
            403,
            "서버의 보안 토큰 형식을 확인할 수 없습니다.",
            "INVALID_CSRF",
          );
        csrf = token;
      }
      headers.set(csrf!.headerName, csrf!.token);
    }
    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      throw new ApiError(
        0,
        "서버에 연결할 수 없습니다. 입력 내용은 유지됩니다.",
        "NETWORK_ERROR",
      );
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) csrf = null;
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        typeof body.message === "string"
          ? body.message
          : response.status === 401
            ? "로그인이 필요합니다."
            : response.status === 403
              ? "이 작업을 수행할 권한이 없거나 보안 토큰이 만료되었습니다."
              : response.status === 409
                ? "이미 처리되었거나 중복된 요청입니다. 목록을 새로고침해 주세요."
                : "요청을 처리하지 못했습니다.",
        body.code,
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json();
  }
  return {
    request,
    resetCsrf: () => {
      csrf = null;
    },
  };
}
