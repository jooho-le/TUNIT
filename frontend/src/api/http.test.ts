import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpApi } from "./http";
import { createHttpClient } from "./client";
import type * as Wire from "./generated";

const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12,"0")}`;
const now = "2026-11-27T00:00:00Z";
const json = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function server() {
  const calls: { path: string; method: string; body: unknown; options: RequestInit }[] = [];
  const tags: Wire.TagSummary[] = [{ id: id(300), name: "Rock", type: "GENRE" }, { id: id(301), name: "Calm", type: "MOOD" }];
  const artists: Wire.ArtistSummary[] = Array.from({length: 6}, (_,index) => ({ id: id(100+index), name: `Artist ${index}`, genres: [tags[0]] }));
  const tracks: Wire.TrackSummary[] = Array.from({length: 11}, (_,index) => ({ id: id(200+index), title: `Track ${index}`, artists: [artists[index%6]], genres: [tags[0]], commonArtistGenres: [tags[0]], externalUrl: null, artworkUrl: null }));
  const auth: Wire.AuthUserResponse = { id: id(1), nickname: "리스너", tasteStatus: "COMPLETE" };
  let saved: Wire.TasteResponse = { artistIds: artists.slice(0,5).map(a=>a.id), trackIds: tracks.slice(0,10).map(t=>t.id), tagIds: tags.map(t=>t.id), tasteStatus: "COMPLETE", updatedAt: now };
  let settings: Wire.ProfileSettings = { isPublic: true, comparisonConsent: false };
  let csrfCount = 0;
  let state: Wire.InvitationStatusResponse = { status: "PENDING", valid: true, requiresLogin: false, readyToCompare: false, viewerRole: "INVITER", expiresAt: "2026-11-28T00:00:00Z" };
  const interest: Wire.InterestResponse = { id: id(400), senderId: id(1), recipientId: id(2), status: "PENDING", createdAt: now, resolvedAt: null };
  const comparison: Wire.MatchDetailResponse = { userId: id(2), nickname: "다른 리스너", similarityScore: .4, commonArtists: [], commonTracks: [], commonGenres: [tags[0]], onlyOtherTracks: [tracks[10]], reason: "공통 장르 Rock" };
  const page = (items: unknown[]) => ({ items, page: 0, size: 50, totalElements: items.length });
  vi.stubGlobal("fetch", vi.fn(async (input: string, options: RequestInit = {}) => {
    const url = new URL(input,"http://example.test"); const path = url.pathname.replace("/api/v1","");
    const method = options.method ?? "GET"; const body = options.body ? JSON.parse(String(options.body)) : undefined;
    calls.push({ path, method, body, options });
    if(path === "/auth/csrf") return json({ token: `csrf-${++csrfCount}`, headerName: "X-CSRF-TOKEN" });
    if(path === "/auth/me" || path === "/auth/login") return json(auth);
    if(path === "/auth/signup") return json({ id: id(1), email: "listener@example.test", nickname: auth.nickname, createdAt: now },201);
    if(path === "/auth/logout") return json(null,204);
    if(path === "/catalog/artists") return json(page(artists));
    if(path === "/catalog/tracks") return json(page(tracks));
    if(path === "/catalog/tags") return json(tags.filter(t=>t.type===url.searchParams.get("type")));
    if(path === "/me/taste") { if(method === "PUT") saved = { ...saved, ...body }; return method === "DELETE" ? json(null,204) : json(saved); }
    if(path === "/me/profile/settings") { if(method === "PATCH") settings = { ...settings, ...body }; return json(settings); }
    if(path === "/me/profile") return json({ userId: id(1), status: "COMPLETE", summary: "Rock에서 찾은 취향", topGenres: [{ tagId: tags[0].id, name: "Rock", weight: 1 }], artistCount: 5, trackCount: 10, updatedAt: now });
    if(path === "/matches") return json(page([]));
    if(path === `/matches/${id(2)}` || path.endsWith("/compare")) return json(comparison);
    if(path === "/discover/tracks") return json(page([tracks[10]]));
    if(path === "/invitations") return json({ invitationUrl: `https://tunit.example.test/#/invite/${"a".repeat(43)}`, expiresAt: state.expiresAt, status: "PENDING" },201);
    if(path.endsWith("/complete")) { state = { ...state, status: "COMPLETED", viewerRole: "RECIPIENT", readyToCompare: true }; return json(state); }
    if(path.startsWith("/invitations/")) return json(state);
    if(path === "/interests") return json(interest,201);
    if(path === "/interests/inbox" || path === "/interests/sent") return json(page([interest]));
    if(path.endsWith("/accept")) return json({ id: interest.id, status: "ACCEPTED", connectionId: id(500), resolvedAt: now });
    if(path === "/connections") return json(page([{ connectionId: id(500), userId: id(2), nickname: "다른 리스너", createdAt: now }]));
    if(path === `/connections/${id(500)}` && method === "DELETE") return json(null,204);
    throw new Error(`Unexpected contract route: ${method} ${path}`);
  }));
  return { calls, api: createHttpApi(), getSettings: () => settings };
}
afterEach(() => vi.unstubAllGlobals());

describe("Spring wire DTO to frontend view model contract", () => {
  it("reads canonical catalog, separate tags, taste IDs and real profile analysis", async () => {
    const { api, calls } = server(); const profile = await api.profile(); const catalog = await api.catalog();
    expect(profile.complete).toBe(true); expect(profile.taste.genres).toEqual(["Rock"]); expect(profile.taste.moods).toEqual(["Calm"]);
    expect(profile.topGenres?.[0].weight).toBe(1); expect(catalog.tracks[0].externalUrl).toBeNull(); expect(catalog.tracks[0].commonArtistGenres).toEqual(["Rock"]);
    expect(calls.some(c=>c.path.startsWith("/music/"))).toBe(false);
    expect(calls.every(c=>c.options.credentials === "include")).toBe(true);
    expect(await api.matches()).toEqual([]);
  });
  it("sends the three UUID arrays only and saves public settings through the separate PATCH", async () => {
    const { api, calls, getSettings } = server(); const profile = await api.profile();
    await api.saveTaste({ ...profile.taste, public: false });
    const put = calls.find(c=>c.method === "PUT")!;
    expect(put.body).toEqual({ artistIds: profile.taste.artists, trackIds: profile.taste.tracks, tagIds: [id(300),id(301)] });
    expect(getSettings().isPublic).toBe(true);
    await api.updateSettings({ isPublic: false }); expect(getSettings().isPublic).toBe(false);
    expect(getSettings().comparisonConsent).toBe(false);
    expect(new Headers(put.options.headers).get("X-CSRF-TOKEN")).toBe("csrf-1");
  });
  it("does not automatically log in after signup and refreshes CSRF after explicit login", async () => {
    const { api, calls } = server();
    await api.signup({ email: "listener@example.test", nickname: "리스너", password: "test-only-password" });
    expect(calls.some(c=>c.path === "/auth/login")).toBe(false);
    await api.login({ email: "listener@example.test", password: "test-only-password" });
    await api.logout();
    expect(calls.filter(c=>c.path === "/auth/csrf")).toHaveLength(3);
    expect(new Headers(calls.find(c=>c.path === "/auth/logout")!.options.headers).get("X-CSRF-TOKEN")).toBe("csrf-3");
  });
  it("uses explicit settings consent then /complete, without posting identities or raw database fields", async () => {
    const { api, calls } = server(); const invite = await api.createInvitation(true);
    expect(invite.viewerRole).toBe("INVITER"); expect(invite.token).toHaveLength(43);
    const completed = await api.acceptInvitation(invite.token,true); expect(completed.status).toBe("READY");
    expect(calls.find(c=>c.path.endsWith("/complete"))?.body).toBeUndefined();
    expect(calls.find(c=>c.path === "/invitations" && c.method === "POST")?.body).toBeUndefined();
    expect((await api.compareInvitation(invite.token)).score).toBe(40);
  });
  it("posts recipientId only and understands action responses and paged histories", async () => {
    const { api, calls } = server(); const sent = await api.sendInterest(id(2),"");
    expect(calls.find(c=>c.path === "/interests")!.body).toEqual({ recipientId: id(2) });
    expect((await api.actOnInterest(sent.id,"accept")).status).toBe("ACCEPTED");
    expect(await api.interests("sent")).toHaveLength(1);
    await expect(api.sendInterest(id(2),"not-supported-note")).rejects.toMatchObject({ status: 400 });
    expect(calls.filter(c=>c.path === "/interests")).toHaveLength(1);
  });
  it("uses connectionId for DELETE and treats 204 as empty while leaving browser storage untouched", async () => {
    const { api, calls } = server(); const storage = vi.spyOn(Storage.prototype,"setItem");
    const [connection] = await api.connections(); expect(connection.id).toBe(id(500));
    await expect(api.disconnect(connection.id)).resolves.toBeUndefined();
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", path: `/connections/${id(500)}` });
    expect(storage).not.toHaveBeenCalled();
  });
  it("reports malformed success JSON and retains safe field errors and request IDs", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response("<html>error</html>"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "INVALID_INPUT", message: "입력 오류", fieldErrors: [{ field: "email", message: "이메일 확인" }, { field: 123 }] }),
        { status: 400, headers: { "X-Request-Id": "request-1" } })));
    const { request } = createHttpClient();
    await expect(request("/me/profile")).rejects.toMatchObject({ status: 502, code: "INVALID_RESPONSE" });
    await expect(request("/me/profile")).rejects.toMatchObject({ status: 400, fieldErrors: [{ field: "email", message: "이메일 확인" }], requestId: "request-1" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
