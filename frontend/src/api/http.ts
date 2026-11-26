import { createHttpClient } from "./client";
import { ApiError, type TunitApi } from "./types";
import type { Artist, Track, Match, Profile, Taste, Invitation, User } from "../types";
import type * as Wire from "./generated";

type Page<T> = { items: T[]; page: number; size: number; totalElements: number };
type CatalogData = { artists: Wire.ArtistSummary[]; tracks: Wire.TrackSummary[]; tags: Wire.TagSummary[] };
const artist = (a: Wire.ArtistSummary): Artist => ({ id: a.id, name: a.name, genre: a.genres.map(g => g.name).join(" · ") || "장르 미등록", art: "lilac" });
const track = (t: Wire.TrackSummary): Track => ({ id: t.id, title: t.title, artist: t.artists.map(a => a.name).join(" · ") || "아티스트 미등록", art: "lilac", length: "—", commonArtistGenres: t.commonArtistGenres.map(g => g.name), externalUrl: t.externalUrl });
const match = (m: Wire.MatchDetailResponse): Match => ({ user: { id: m.userId, nickname: m.nickname }, score: m.similarityScore === null ? null : Math.round(m.similarityScore * 100),
  commonArtists: m.commonArtists.map(artist), commonTracks: m.commonTracks.map(track), newTracks: m.onlyOtherTracks.map(track),
  differentArtists: [], genres: m.commonGenres.map(g => g.name), moods: [], reason: m.reason ?? "비교할 정보가 부족합니다." });

/** Wire DTOs are generated from OpenAPI. View models are converted explicitly; no local accounts are used. */
export function createHttpApi(): TunitApi {
  const { request, resetCsrf } = createHttpClient();
  let catalogPromise: Promise<CatalogData> | null = null;
  const post = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const all = async <T>(path: string): Promise<T[]> => {
    const first = await request<Page<T>>(`${path}?page=0&size=50`);
    if (!Array.isArray(first.items) || !Number.isSafeInteger(first.totalElements) || first.totalElements < 0 || first.size < 1 || first.size > 50)
      throw new ApiError(502, "서버 목록 형식을 확인할 수 없습니다.", "INVALID_RESPONSE");
    const pages = Math.ceil(first.totalElements / first.size);
    if (pages > 200) throw new ApiError(413, "목록이 커서 한 번에 불러올 수 없습니다.", "CATALOG_TOO_LARGE");
    const items = [...first.items];
    // Bounded by the first response, with no retries or background sync.
    for (let page = 1; page < pages; page++) {
      const result = await request<Page<T>>(`${path}?page=${page}&size=50`);
      if (!Array.isArray(result.items)) throw new ApiError(502, "서버 목록 형식을 확인할 수 없습니다.", "INVALID_RESPONSE");
      items.push(...result.items);
    }
    return items;
  };
  const catalog = (): Promise<CatalogData> => catalogPromise ??= Promise.all([
    all<Wire.ArtistSummary>("/catalog/artists"), all<Wire.TrackSummary>("/catalog/tracks"),
    request<Wire.TagSummary[]>("/catalog/tags?type=GENRE"), request<Wire.TagSummary[]>("/catalog/tags?type=MOOD"),
  ]).then(([artists, tracks, genres, moods]) => ({ artists, tracks, tags: [...genres, ...moods] })).catch(error => { catalogPromise = null; throw error; });
  const me = async (): Promise<User | null> => {
    try { return await request<Wire.AuthUserResponse>("/auth/me"); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  };
  const own = async () => { const user = await me(); if (!user) throw new ApiError(401, "로그인 후 이용해 주세요.", "UNAUTHORIZED"); return user; };
  const viewTaste = (saved: Wire.TasteResponse, data: CatalogData, isPublic: boolean): Taste => ({
    artists: saved.artistIds, tracks: saved.trackIds,
    genres: data.tags.filter(t => t.type === "GENRE" && saved.tagIds.includes(t.id)).map(t => t.name),
    moods: data.tags.filter(t => t.type === "MOOD" && saved.tagIds.includes(t.id)).map(t => t.name), public: isPublic,
  });
  const profile = async (): Promise<Profile> => {
    const [user, saved, settings, summary, data] = await Promise.all([own(), request<Wire.TasteResponse>("/me/taste"),
      request<Wire.ProfileSettings>("/me/profile/settings"), request<Wire.TasteProfileResponse>("/me/profile"), catalog()]);
    return { user, taste: viewTaste(saved, data, settings.isPublic), complete: saved.tasteStatus === "COMPLETE", analysis: "basic", summary: summary.summary, topGenres: summary.topGenres };
  };
  const updateSettings = async (settings: Wire.ProfileSettingsPatch) => { await request<Wire.ProfileSettings>("/me/profile/settings", { method: "PATCH", body: JSON.stringify(settings) }); };
  const invitation = (token: string, s: Wire.InvitationStatusResponse): Invitation => ({ token, viewerRole: s.viewerRole,
    recipientId: null, expiresAt: s.expiresAt,
    status: s.status === "EXPIRED" ? "EXPIRED" : !s.valid || s.status === "COMPLETED" && s.viewerRole === "VISITOR" ? "UNAVAILABLE"
      : s.readyToCompare ? "READY" : s.status === "COMPLETED" ? "NEEDS_CONSENT" : "WAITING",
  });
  const unsupported = async (): Promise<never> => { throw new ApiError(403, "등록된 음악 목록에서 선택해 주세요.", "ACCESS_DENIED"); };
  return {
    me,
    signup: async input => { const result = await post<Wire.SignupResponse>("/auth/signup", input); resetCsrf(); return result; },
    login: async input => { const user = await post<Wire.AuthUserResponse>("/auth/login", input); resetCsrf(); catalogPromise = null; return user; },
    logout: async () => { await post<void>("/auth/logout"); resetCsrf(); catalogPromise = null; },
    profile,
    saveTaste: async taste => {
      const [before, data] = await Promise.all([profile(), catalog()]);
      const tagIds = [...taste.genres.map(name => data.tags.find(t => t.type === "GENRE" && t.name === name)?.id),
        ...taste.moods.map(name => data.tags.find(t => t.type === "MOOD" && t.name === name)?.id)];
      if (tagIds.some(id => !id)) throw new ApiError(400, "선택한 장르·무드 목록을 다시 확인해 주세요.", "INVALID_TASTE_INPUT");
      const body: Wire.TasteReplaceRequest = { artistIds: taste.artists, trackIds: taste.tracks, tagIds: tagIds as string[] };
      const saved = await request<Wire.TasteResponse>("/me/taste", { method: "PUT", body: JSON.stringify(body) });
      return { ...before, taste: viewTaste(saved, data, before.taste.public), complete: saved.tasteStatus === "COMPLETE", summary: null, topGenres: [] };
    },
    deleteTaste: () => request<void>("/me/taste", { method: "DELETE" }),
    updateSettings,
    updateNickname: nickname => request<Wire.AuthUserResponse>("/me/profile", { method: "PATCH", body: JSON.stringify({ nickname }) }),
    catalog: async () => { const data = await catalog(); return { artists: data.artists.map(artist), tracks: data.tracks.map(track),
      genres: data.tags.filter(t => t.type === "GENRE").map(t => t.name), moods: data.tags.filter(t => t.type === "MOOD").map(t => t.name) }; },
    addArtist: unsupported, addTrack: unsupported,
    matches: async () => {
      const page = await request<Wire.PageMatchCard>("/matches?page=0&size=10");
      const results = await Promise.all(page.items.map(async card => {
        try { return match(await request<Wire.MatchDetailResponse>(`/matches/${encodeURIComponent(card.userId)}`)); }
        catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
      }));
      return results.filter((m): m is Match => m !== null);
    },
    match: async id => match(await request<Wire.MatchDetailResponse>(`/matches/${encodeURIComponent(id)}`)),
    discovery: async () => (await all<Wire.TrackSummary>("/discover/tracks")).map(track),
    createInvitation: async consent => {
      if (!consent) throw new ApiError(400, "비교 동의가 필요합니다.");
      await updateSettings({ comparisonConsent: true });
      const result = await post<Wire.InvitationCreateResponse>("/invitations");
      const hash = new URL(result.invitationUrl).hash;
      const token = hash.split("/").at(-1);
      if (!token) throw new ApiError(502, "초대 링크 형식을 확인할 수 없습니다.", "INVALID_RESPONSE");
      return { token, viewerRole: "INVITER", recipientId: null, expiresAt: result.expiresAt, status: "WAITING", invitationUrl: result.invitationUrl };
    },
    invitation: async token => invitation(token, await request<Wire.InvitationStatusResponse>(`/invitations/${encodeURIComponent(token)}`)),
    acceptInvitation: async (token, consent) => {
      if (!consent) throw new ApiError(400, "비교 동의가 필요합니다.");
      await updateSettings({ comparisonConsent: true });
      return invitation(token, await post<Wire.InvitationStatusResponse>(`/invitations/${encodeURIComponent(token)}/complete`));
    },
    compareInvitation: async token => match(await request<Wire.MatchDetailResponse>(`/invitations/${encodeURIComponent(token)}/compare`)),
    sendInterest: async (recipientId, note) => {
      if (note) throw new ApiError(400, "현재 관심 요청은 한마디 없이 전송됩니다.", "INVALID_INPUT");
      const user = await own();
      const result = await post<Wire.InterestResponse>("/interests", { recipientId });
      return { ...result, senderName: user.nickname, recipientName: "상대", note: "" };
    },
    interests: async kind => {
      const [user, rows] = await Promise.all([own(), all<Wire.InterestResponse>(`/interests/${kind}`)]);
      return rows.map(row => ({ ...row, senderName: row.senderId === user.id ? user.nickname : "상대", recipientName: row.recipientId === user.id ? user.nickname : "상대", note: "" }));
    },
    actOnInterest: (id, action) => post<Wire.InterestActionResponse>(`/interests/${encodeURIComponent(id)}/${action}`),
    connections: async () => {
      const [user, rows] = await Promise.all([own(), all<Wire.ConnectionSummary>("/connections")]);
      return rows.map(c => ({ id: c.connectionId, userA: user.id, userB: c.userId, partner: { id: c.userId, nickname: c.nickname } }));
    },
    disconnect: id => request<void>(`/connections/${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
}
