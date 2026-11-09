import type {
  Artist,
  Catalog,
  Connection,
  Interest,
  Invitation,
  Match,
  Profile,
  Taste,
  Track,
  User,
} from "../types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export interface TunitApi {
  me(): Promise<User | null>;
  signup(input: {
    email: string;
    nickname: string;
    password: string;
  }): Promise<User>;
  login(input: { email: string; password: string }): Promise<User>;
  logout(): Promise<void>;
  profile(): Promise<Profile>;
  saveTaste(taste: Taste): Promise<Profile>;
  deleteTaste(): Promise<void>;
  updateNickname(nickname: string): Promise<User>;
  catalog(): Promise<Catalog>;
  addArtist(name: string): Promise<Artist>;
  addTrack(title: string, artist: string): Promise<Track>;
  matches(): Promise<Match[]>;
  match(userId: string): Promise<Match>;
  discovery(): Promise<Track[]>;
  createInvitation(consent: boolean): Promise<Invitation>;
  invitation(token: string): Promise<Invitation>;
  acceptInvitation(token: string, consent: boolean): Promise<Invitation>;
  compareInvitation(token: string): Promise<Match>;
  sendInterest(userId: string, note: string): Promise<Interest>;
  interests(kind: "inbox" | "sent"): Promise<Interest[]>;
  actOnInterest(
    id: string,
    action: "accept" | "reject" | "cancel",
  ): Promise<Interest>;
  connections(): Promise<Connection[]>;
}
export type {
  Artist,
  Catalog,
  Connection,
  Interest,
  Invitation,
  Match,
  Profile,
  Taste,
  Track,
  User,
};
