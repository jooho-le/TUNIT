import { describe, expect, it, vi, afterEach } from "vitest";
import { createHttpClient } from "./client";
import { createHttpApi } from "./http";
import { safeReturn } from "../features/auth/returnTo";

const response = (data: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
afterEach(() => vi.unstubAllGlobals());
describe("future HTTP adapter contract (mock fetch; no server)", () => {
  it("includes session credentials and fetches a CSRF token before mutation", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ token: "test-csrf", headerName: "X-CSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(response({}, 204));
    vi.stubGlobal("fetch", fetcher);
    await createHttpClient().request("/interests/one/accept", {
      method: "POST",
      body: "{}",
    });
    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/auth/csrf");
    const [url, options] = fetcher.mock.calls[1];
    expect(url).toBe("/api/v1/interests/one/accept");
    expect(options.credentials).toBe("include");
    expect(options.headers.get("X-CSRF-TOKEN")).toBe("test-csrf");
  });
  it("does not send a mutation when a CSRF token is absent or malformed", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(response({ headerName: "X-CSRF-TOKEN" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      createHttpClient().request("/interests/one/accept", { method: "POST" }),
    ).rejects.toMatchObject({ status: 403, code: "INVALID_CSRF" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("shows 409 without automatically retrying a state-changing call", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ token: "test", headerName: "X-CSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(
        response({ message: "이미 수락됨", code: "STATE_CONFLICT" }, 409),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      createHttpClient().request("/interests/one/cancel", { method: "POST" }),
    ).rejects.toMatchObject({ status: 409, code: "STATE_CONFLICT" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("clears a rejected CSRF token and obtains a new token only on an explicit retry", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ token: "old", headerName: "X-CSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(response({}, 403))
      .mockResolvedValueOnce(
        response({ token: "new", headerName: "X-CSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(response({}, 204));
    vi.stubGlobal("fetch", fetcher);
    const client = createHttpClient();
    await expect(
      client.request("/me/taste", { method: "DELETE" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await client.request("/me/taste", { method: "DELETE" });
    expect(fetcher.mock.calls[3][1].headers.get("X-CSRF-TOKEN")).toBe("new");
  });
  it("resets the token after login because Spring can rotate CSRF tokens", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ token: "pre-login", headerName: "X-CSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(
        response({ id: "a", email: "a@example.com", nickname: "A" }),
      )
      .mockResolvedValueOnce(
        response({ token: "after-login", headerName: "X-CSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(response({}, 204));
    vi.stubGlobal("fetch", fetcher);
    const http = createHttpApi();
    await http.login({ email: "a@example.com", password: "test-password" });
    await http.logout();
    expect(fetcher.mock.calls[3][1].headers.get("X-CSRF-TOKEN")).toBe(
      "after-login",
    );
  });
  it("reports network failure without substituting fake success, and rejects cross-origin bases", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(createHttpClient().request("/matches")).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
    expect(() => createHttpClient("https://other.example/api/v1")).toThrow();
    expect(safeReturn("https://other.example/")).toBe("/home");
    expect(safeReturn("//other.example")).toBe("/home");
    expect(safeReturn("/invite/real-token")).toBe("/invite/real-token");
  });
});
