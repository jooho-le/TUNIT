import { createHttpClient } from "./client";
import type { TunitApi } from "./types";
export function createHttpApi(): TunitApi {
  const { request, resetCsrf } = createHttpClient();
  const post = <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) });
  return {
    me: async () => {
      try {
        return await request("/auth/me");
      } catch (error) {
        if ((error as { status: number }).status === 401) return null;
        throw error;
      }
    },
    signup: async (input) => {
      const user = await post<import("./types").User>("/auth/signup", input);
      resetCsrf();
      return user;
    },
    login: async (input) => {
      const user = await post<import("./types").User>("/auth/login", input);
      resetCsrf();
      return user;
    },
    logout: async () => {
      await post("/auth/logout", {});
      resetCsrf();
    },
    profile: () => request("/me/profile"),
    saveTaste: (taste) =>
      request("/me/taste", { method: "PUT", body: JSON.stringify(taste) }),
    deleteTaste: () => request("/me/taste", { method: "DELETE" }),
    updateNickname: (nickname) =>
      request("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ nickname }),
      }),
    catalog: () => request("/music/catalog"),
    addArtist: (name) => post("/music/artists", { name }),
    addTrack: (title, artist) => post("/music/tracks", { title, artist }),
    matches: () => request("/matches"),
    match: (id) => request(`/matches/${encodeURIComponent(id)}`),
    discovery: () => request("/discover/tracks"),
    createInvitation: (consent) => post("/invitations", { consent }),
    invitation: (token) => request(`/invitations/${encodeURIComponent(token)}`),
    acceptInvitation: (token, consent) =>
      post(`/invitations/${encodeURIComponent(token)}/accept`, { consent }),
    compareInvitation: (token) =>
      request(`/invitations/${encodeURIComponent(token)}/compare`),
    sendInterest: (recipientId, note) =>
      post("/interests", { recipientId, note }),
    interests: (kind) => request(`/interests/${kind}`),
    actOnInterest: (id, action) =>
      post(`/interests/${encodeURIComponent(id)}/${action}`, {}),
    connections: () => request("/connections"),
  };
}
