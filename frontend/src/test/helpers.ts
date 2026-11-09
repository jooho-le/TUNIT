import { createMockApi } from "../api/mock";
import { catalogArtists, catalogTracks } from "../features/catalog";
import type { Taste } from "../types";
export class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}
export const validTaste = (isPublic = true): Taste => ({
  artists: catalogArtists.slice(0, 5).map((a) => a.id),
  tracks: catalogTracks.slice(0, 10).map((t) => t.id),
  genres: ["Indie"],
  moods: ["몽환적인"],
  public: isPublic,
});
export async function actor(email: string, storage: Storage, isPublic = true) {
  const session = new MemoryStorage();
  const api = createMockApi({ storage, session });
  const user = await api.signup({
    email,
    nickname: email.split("@")[0],
    password: "demo-password-123",
  });
  await api.saveTaste(validTaste(isPublic));
  return { api, user, session };
}
