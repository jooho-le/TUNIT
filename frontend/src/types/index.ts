export interface User {
  id: string;
  email?: string;
  nickname: string;
}
export interface Artist {
  id: string;
  name: string;
  genre: string;
  art: string;
}
export interface Track {
  commonArtistGenres?: string[];
  externalUrl?: string | null;
  id: string;
  title: string;
  artist: string;
  art: string;
  length: string;
}
export interface Taste {
  artists: string[];
  tracks: string[];
  genres: string[];
  moods: string[];
  public: boolean;
}
export interface Profile {
  summary?: string | null;
  topGenres?: { tagId: string; name: string; weight: number }[];
  user: User;
  taste: Taste;
  complete: boolean;
  analysis: "basic" | "ai";
}
export interface Match {
  user: Pick<User, "id" | "nickname">;
  score: number | null;
  commonArtists: Artist[];
  commonTracks: Track[];
  newTracks: Track[];
  differentArtists: Artist[];
  genres: string[];
  moods: string[];
  reason: string;
}
export type InterestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
export interface Interest {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  recipientName: string;
  note: string;
  status: InterestStatus;
  createdAt: string;
}
export interface Connection {
  id: string;
  userA: string;
  userB: string;
  requestId?: string;
  partner: Pick<User, "id" | "nickname">;
}
export type InvitationStatus =
  | "WAITING"
  | "NEEDS_PROFILE"
  | "NEEDS_CONSENT"
  | "READY"
  | "UNAVAILABLE"
  | "EXPIRED";
export interface Invitation {
  viewerRole?: "INVITER" | "RECIPIENT" | "VISITOR" | "ANONYMOUS";
  invitationUrl?: string;
  token: string;
  inviterId?: string;
  inviterName?: string;
  recipientId: string | null;
  inviterConsent?: boolean;
  recipientConsent?: boolean;
  expiresAt: string;
  status: InvitationStatus;
}
export interface Catalog {
  genres?: string[];
  moods?: string[];
  artists: Artist[];
  tracks: Track[];
}
export const emptyTaste = (): Taste => ({
  artists: [],
  tracks: [],
  genres: [],
  moods: [],
  public: false,
});
export const completeTaste = (taste: Taste) =>
  taste.artists.length >= 5 &&
  taste.tracks.length >= 10 &&
  taste.genres.length > 0 &&
  taste.moods.length > 0;
