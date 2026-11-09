import { describe, expect, it } from "vitest";
import { createMockApi } from "./mock";
import { MemoryStorage, actor, validTaste } from "../test/helpers";

describe("front-end adapter: accounts, taste and real local candidates", () => {
  it("starts empty and refuses unsigned private reads/writes", async () => {
    const api = createMockApi({
      storage: new MemoryStorage(),
      session: new MemoryStorage(),
    });
    expect(await api.me()).toBeNull();
    await expect(api.profile()).rejects.toMatchObject({ status: 401 });
    await expect(api.saveTaste(validTaste())).rejects.toMatchObject({
      status: 401,
    });
  });
  it("signs up, rejects duplicate email and bad login; never stores a raw password", async () => {
    const storage = new MemoryStorage(),
      session = new MemoryStorage(),
      api = createMockApi({ storage, session });
    const user = await api.signup({
      email: "A@example.com",
      nickname: "A",
      password: "demo-password-123",
    });
    expect(await api.me()).toEqual(user);
    expect(storage.getItem("tunit-browser-demo-v1")).not.toContain(
      "demo-password-123",
    );
    await expect(
      api.signup({
        email: "a@example.com",
        nickname: "B",
        password: "demo-password-123",
      }),
    ).rejects.toMatchObject({ status: 409 });
    await api.logout();
    await expect(
      api.login({ email: "a@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({ status: 401 });
    await api.login({ email: "a@example.com", password: "demo-password-123" });
    expect((await createMockApi({ storage, session }).profile()).user.id).toBe(
      user.id,
    );
  });
  it("keeps taste through reload, deduplicates IDs and deletes only the current user taste", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage);
    const taste = validTaste();
    taste.artists.push(taste.artists[0]);
    taste.tracks.push(taste.tracks[0]);
    await a.api.saveTaste(taste);
    const reloaded = createMockApi({ storage, session: a.session });
    expect((await reloaded.profile()).taste.artists).toHaveLength(5);
    expect((await reloaded.profile()).taste.tracks).toHaveLength(10);
    await reloaded.deleteTaste();
    expect((await reloaded.profile()).complete).toBe(false);
    expect((await b.api.profile()).complete).toBe(true);
    await expect(reloaded.matches()).rejects.toMatchObject({ status: 422 });
  });
  it("offers zero candidates for one user, then computes actual common preferences", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage);
    expect(await a.api.matches()).toEqual([]);
    expect((await a.api.discovery()).length).toBe(10);
    const b = await actor("b@example.com", storage);
    const matches = await a.api.matches();
    expect(matches).toHaveLength(1);
    expect(matches[0].user.id).toBe(b.user.id);
    expect(matches[0].score).toBe(100);
    expect(matches[0].commonArtists).toHaveLength(5);
    expect(matches[0].commonTracks).toHaveLength(10);
  });
  it("immediately removes private or deleted peer tastes from matches and comparisons", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage);
    await b.api.saveTaste(validTaste(false));
    expect(await a.api.matches()).toEqual([]);
    await expect(a.api.match(b.user.id)).rejects.toMatchObject({ status: 403 });
    await b.api.deleteTaste();
    await expect(a.api.match(b.user.id)).rejects.toMatchObject({ status: 422 });
  });
  it("logout invalidates protected front-end operations without deleting data", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage);
    await a.api.logout();
    await expect(a.api.saveTaste(validTaste())).rejects.toMatchObject({
      status: 401,
    });
    await a.api.login({
      email: "a@example.com",
      password: "demo-password-123",
    });
    expect((await a.api.profile()).complete).toBe(true);
  });
});

describe("front-end interest state machine: actor checks and terminal states", () => {
  it("refuses self and duplicate requests, creates a pending request", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage);
    await expect(a.api.sendInterest(a.user.id, "")).rejects.toMatchObject({
      status: 400,
    });
    const request = await a.api.sendInterest(b.user.id, "반가워요");
    expect(request.status).toBe("PENDING");
    await expect(a.api.sendInterest(b.user.id, "다시")).rejects.toMatchObject({
      status: 409,
    });
    await expect(b.api.sendInterest(a.user.id, "역방향")).rejects.toMatchObject(
      { status: 409 },
    );
    expect(await b.api.interests("inbox")).toHaveLength(1);
  });
  it("allows only receiver accept/reject and sender cancel", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage),
      c = await actor("c@example.com", storage);
    const r = await a.api.sendInterest(b.user.id, "");
    await expect(a.api.actOnInterest(r.id, "accept")).rejects.toMatchObject({
      status: 403,
    });
    await expect(c.api.actOnInterest(r.id, "reject")).rejects.toMatchObject({
      status: 403,
    });
    await expect(b.api.actOnInterest(r.id, "cancel")).rejects.toMatchObject({
      status: 403,
    });
    expect((await a.api.interests("sent"))[0].status).toBe("PENDING");
  });
  it.each(["accept", "reject", "cancel"] as const)(
    "performs %s exactly once and rejects further terminal actions",
    async (action) => {
      const storage = new MemoryStorage(),
        a = await actor("a@example.com", storage),
        b = await actor("b@example.com", storage);
      const request = await a.api.sendInterest(b.user.id, "");
      const api = action === "cancel" ? a.api : b.api;
      const result = await api.actOnInterest(request.id, action);
      expect(result.status).toBe(
        action === "accept"
          ? "ACCEPTED"
          : action === "reject"
            ? "REJECTED"
            : "CANCELLED",
      );
      expect(await a.api.connections()).toHaveLength(
        action === "accept" ? 1 : 0,
      );
      await expect(
        b.api.actOnInterest(request.id, "accept"),
      ).rejects.toMatchObject({ status: 409 });
      await expect(
        a.api.actOnInterest(request.id, "cancel"),
      ).rejects.toMatchObject({ status: 409 });
    },
  );
  it("retains pending and zero connections when the local commit fails (not a DB transaction test)", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage);
    const request = await a.api.sendInterest(b.user.id, "");
    const fail = createMockApi({
      storage,
      session: b.session,
      beforeCommit: () => {
        throw new Error("simulated storage failure");
      },
    });
    await expect(
      fail.actOnInterest(request.id, "accept"),
    ).rejects.toMatchObject({ status: 500 });
    expect((await a.api.interests("sent"))[0].status).toBe("PENDING");
    expect(await b.api.connections()).toEqual([]);
  });
  it("resolves a sequential local accept/cancel collision once; no duplicate local connection", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage);
    const r = await a.api.sendInterest(b.user.id, "");
    const results = await Promise.allSettled([
      b.api.actOnInterest(r.id, "accept"),
      a.api.actOnInterest(r.id, "cancel"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await a.api.connections()).toHaveLength(1);
  });
});

describe("front-end invitations: wait, consent, expiry and account return", () => {
  it("does not expose comparison until participation, complete tastes and both consents", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage);
    await expect(a.api.createInvitation(false)).rejects.toMatchObject({
      status: 403,
    });
    const invitation = await a.api.createInvitation(true);
    expect(invitation.status).toBe("WAITING");
    await expect(
      a.api.compareInvitation(invitation.token),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      b.api.acceptInvitation(invitation.token, false),
    ).rejects.toMatchObject({ status: 403 });
    await b.api.acceptInvitation(invitation.token, true);
    expect((await a.api.compareInvitation(invitation.token)).user.id).toBe(
      b.user.id,
    );
    await b.api.saveTaste(validTaste(false));
    await expect(
      a.api.compareInvitation(invitation.token),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("denies expired links and unrelated third users without comparison disclosure", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage),
      b = await actor("b@example.com", storage),
      c = await actor("c@example.com", storage);
    const inv = await a.api.createInvitation(true);
    await b.api.acceptInvitation(inv.token, true);
    await expect(c.api.compareInvitation(inv.token)).rejects.toMatchObject({
      status: 403,
    });
    const expired = createMockApi({
      storage,
      session: a.session,
      now: () => Date.now() + 48 * 3600000,
    });
    expect((await expired.invitation(inv.token)).status).toBe("EXPIRED");
    await expect(expired.compareInvitation(inv.token)).rejects.toMatchObject({
      status: 410,
    });
  });
  it("retains the invite across login, then allows comparison only after completing taste", async () => {
    const storage = new MemoryStorage(),
      a = await actor("a@example.com", storage);
    const inv = await a.api.createInvitation(true);
    const session = new MemoryStorage(),
      b = createMockApi({ storage, session });
    await b.signup({
      email: "new@example.com",
      nickname: "새친구",
      password: "demo-password-123",
    });
    await expect(b.acceptInvitation(inv.token, true)).rejects.toMatchObject({
      status: 422,
    });
    await b.saveTaste(validTaste());
    await b.acceptInvitation(inv.token, true);
    expect((await b.compareInvitation(inv.token)).user.id).toBe(a.user.id);
  });
});
