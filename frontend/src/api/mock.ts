/** Browser-only adapter for front-end verification. No sample people are seeded. */
import {
  catalogArtists,
  catalogTracks,
  genres,
  moods,
} from "../features/catalog";
import {
  completeTaste,
  emptyTaste,
  type Taste,
  type User,
  type Match,
  type Interest,
  type Invitation,
  type Connection,
  type Artist,
  type Track,
} from "../types";
import { ApiError, type TunitApi } from "./types";

interface LocalUser extends User {
  salt: string;
  passwordHash: string;
  taste: Taste;
}
interface LocalInvitation extends Omit<Invitation, "status"> {}
interface Database {
  version: 1;
  users: LocalUser[];
  artists: Artist[];
  tracks: Track[];
  invitations: LocalInvitation[];
  interests: Interest[];
  connections: Omit<Connection, "partner">[];
}
const DB_KEY = "tunit-browser-demo-v1";
const SESSION_KEY = "tunit-browser-demo-session";
const initial = (): Database => ({
  version: 1,
  users: [],
  artists: structuredClone(catalogArtists),
  tracks: structuredClone(catalogTracks),
  invitations: [],
  interests: [],
  connections: [],
});
const publicUser = ({ id, email, nickname }: User): User => ({
  id,
  email,
  nickname,
});
const unique = (values: string[]) => [...new Set(values)];
const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");

async function passwordDigest(password: string, salt: string) {
  if (!crypto.subtle)
    throw new ApiError(
      0,
      "로컬 계정 체험은 HTTPS 또는 localhost에서 사용할 수 있습니다.",
    );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode(salt),
        iterations: 120000,
        hash: "SHA-256",
      },
      key,
      256,
    ),
  );
}

export function createMockApi(
  options: {
    storage?: Storage;
    session?: Storage;
    now?: () => number;
    beforeCommit?: () => void;
  } = {},
): TunitApi {
  const storage = options.storage ?? localStorage;
  const session = options.session ?? sessionStorage;
  const now = options.now ?? Date.now;
  const read = (): Database => {
    try {
      const raw = storage.getItem(DB_KEY);
      if (!raw) return initial();
      const db = JSON.parse(raw);
      if (
        db.version !== 1 ||
        ![
          db.users,
          db.artists,
          db.tracks,
          db.invitations,
          db.interests,
          db.connections,
        ].every(Array.isArray)
      )
        throw new Error();
      return db;
    } catch {
      throw new ApiError(
        500,
        "이 브라우저의 데모 데이터를 읽지 못했습니다. 기존 데이터는 덮어쓰지 않았습니다.",
      );
    }
  };
  const write = (db: Database) => {
    try {
      options.beforeCommit?.();
      storage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      throw new ApiError(500, "저장하지 못했습니다. 기존 데이터는 유지됩니다.");
    }
  };
  const active = (db = read()) => {
    const id = session.getItem(SESSION_KEY);
    const user = db.users.find((u) => u.id === id);
    if (!user) throw new ApiError(401, "로그인이 필요합니다.");
    return user;
  };
  const ready = (db = read()) => {
    const user = active(db);
    if (!completeTaste(user.taste))
      throw new ApiError(
        422,
        "취향 입력을 먼저 완료해 주세요.",
        "TASTE_INCOMPLETE",
      );
    return user;
  };
  const profile = (user: LocalUser) => ({
    user: publicUser(user),
    taste: structuredClone(user.taste),
    complete: completeTaste(user.taste),
    analysis: "basic" as const,
  });
  const invitationStatus = (
    inv: LocalInvitation,
    db: Database,
  ): Invitation["status"] => {
    if (new Date(inv.expiresAt).getTime() <= now()) return "EXPIRED";
    if (!inv.recipientId) return "WAITING";
    const from = db.users.find((u) => u.id === inv.inviterId),
      to = db.users.find((u) => u.id === inv.recipientId);
    if (!from || !to || !completeTaste(from.taste) || !completeTaste(to.taste))
      return "NEEDS_PROFILE";
    if (
      !from.taste.public ||
      !to.taste.public ||
      !inv.inviterConsent ||
      !inv.recipientConsent
    )
      return "NEEDS_CONSENT";
    return "READY";
  };
  const findInvitation = (token: string, db: Database) => {
    const inv = db.invitations.find((i) => i.token === token);
    if (!inv) throw new ApiError(404, "초대 링크를 찾을 수 없습니다.");
    return inv;
  };
  const compare = (me: LocalUser, other: LocalUser, db: Database): Match => {
    if (!completeTaste(me.taste) || !completeTaste(other.taste))
      throw new ApiError(422, "양쪽 모두 취향 입력을 완료해야 합니다.");
    if (!other.taste.public)
      throw new ApiError(403, "상대가 취향을 비공개로 변경했습니다.");
    const commonArtists = db.artists.filter(
      (a) =>
        me.taste.artists.includes(a.id) && other.taste.artists.includes(a.id),
    );
    const commonTracks = db.tracks.filter(
      (t) =>
        me.taste.tracks.includes(t.id) && other.taste.tracks.includes(t.id),
    );
    const similarity = (a: string[], b: string[]) => {
      const union = new Set([...a, ...b]);
      return union.size
        ? a.filter((id) => b.includes(id)).length / union.size
        : 0;
    };
    const score = Math.round(
      100 *
        (0.4 * similarity(me.taste.artists, other.taste.artists) +
          0.3 * similarity(me.taste.tracks, other.taste.tracks) +
          0.3 *
            similarity(
              [...me.taste.genres, ...me.taste.moods],
              [...other.taste.genres, ...other.taste.moods],
            )),
    );
    return {
      user: { id: other.id, nickname: other.nickname },
      score,
      commonArtists,
      commonTracks,
      newTracks: db.tracks.filter(
        (t) =>
          other.taste.tracks.includes(t.id) && !me.taste.tracks.includes(t.id),
      ),
      differentArtists: db.artists.filter(
        (a) =>
          other.taste.artists.includes(a.id) &&
          !me.taste.artists.includes(a.id),
      ),
      genres: other.taste.genres,
      moods: other.taste.moods,
      reason: `공통 아티스트 ${commonArtists.length}명, 공통곡 ${commonTracks.length}곡과 선택한 장르·무드를 비교했습니다.`,
    };
  };
  return {
    async me() {
      try {
        return publicUser(active());
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    async signup(input) {
      const email = input.email.trim().toLowerCase(),
        nickname = input.nickname.trim();
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !nickname ||
        nickname.length > 12 ||
        input.password.length < 8
      )
        throw new ApiError(
          400,
          "이메일·닉네임·8자 이상 비밀번호를 확인해 주세요.",
        );
      if (read().users.some((u) => u.email === email))
        throw new ApiError(409, "이미 가입한 이메일입니다.", "EMAIL_EXISTS");
      const salt = crypto.randomUUID(),
        passwordHash = await passwordDigest(input.password, salt);
      const db = read();
      if (db.users.some((u) => u.email === email))
        throw new ApiError(409, "이미 가입한 이메일입니다.");
      const user: LocalUser = {
        id: crypto.randomUUID(),
        email,
        nickname,
        salt,
        passwordHash,
        taste: emptyTaste(),
      };
      db.users.push(user);
      write(db);
      session.setItem(SESSION_KEY, user.id);
      return publicUser(user);
    },
    async login(input) {
      const user = read().users.find(
        (u) => u.email === input.email.trim().toLowerCase(),
      );
      if (
        !user ||
        user.passwordHash !== (await passwordDigest(input.password, user.salt))
      )
        throw new ApiError(
          401,
          "이메일 또는 비밀번호를 확인해 주세요.",
          "INVALID_CREDENTIALS",
        );
      session.setItem(SESSION_KEY, user.id);
      return publicUser(user);
    },
    async logout() {
      session.removeItem(SESSION_KEY);
    },
    async profile() {
      return profile(active());
    },
    async updateNickname(nickname) {
      const db = read(),
        me = active(db);
      if (!nickname.trim() || nickname.trim().length > 12)
        throw new ApiError(400, "닉네임은 1~12자로 입력해 주세요.");
      me.nickname = nickname.trim();
      write(db);
      return publicUser(me);
    },
    async saveTaste(taste) {
      const db = read(),
        me = active(db);
      if (
        ![taste.artists, taste.tracks, taste.genres, taste.moods].every(
          Array.isArray,
        )
      )
        throw new ApiError(400, "취향 입력 형식을 확인해 주세요.");
      if (
        taste.artists.some((id) => !db.artists.some((a) => a.id === id)) ||
        taste.tracks.some((id) => !db.tracks.some((t) => t.id === id))
      )
        throw new ApiError(400, "존재하지 않는 음악 정보가 있습니다.");
      const selected = {
        artists: unique(taste.artists),
        tracks: unique(taste.tracks),
        genres: unique(taste.genres),
        moods: unique(taste.moods),
        public: !!taste.public,
      };
      if (
        selected.artists.length > 5 ||
        selected.tracks.length > 10 ||
        selected.genres.length > 3 ||
        selected.moods.length > 3 ||
        selected.genres.some((g) => !genres.includes(g)) ||
        selected.moods.some((m) => !moods.includes(m))
      )
        throw new ApiError(400, "선택 개수와 장르·분위기를 확인해 주세요.");
      me.taste = selected;
      write(db);
      return profile(me);
    },
    async deleteTaste() {
      const db = read();
      active(db).taste = emptyTaste();
      write(db);
    },
    async catalog() {
      active();
      const db = read();
      return { artists: db.artists, tracks: db.tracks };
    },
    async addArtist(name) {
      const db = read();
      active(db);
      name = name.trim();
      if (!name || name.length > 80)
        throw new ApiError(400, "아티스트 이름을 1~80자로 입력해 주세요.");
      let item = db.artists.find(
        (a) => a.name.toLowerCase() === name.toLowerCase(),
      );
      if (!item) {
        item = {
          id: crypto.randomUUID(),
          name,
          genre: "직접 입력",
          art: "lilac",
        };
        db.artists.push(item);
        write(db);
      }
      return item;
    },
    async addTrack(title, artist) {
      const db = read();
      active(db);
      title = title.trim();
      artist = artist.trim();
      if (!title || !artist || title.length > 100 || artist.length > 80)
        throw new ApiError(400, "곡명과 아티스트를 입력해 주세요.");
      let item = db.tracks.find(
        (t) =>
          t.title.toLowerCase() === title.toLowerCase() &&
          t.artist.toLowerCase() === artist.toLowerCase(),
      );
      if (!item) {
        item = {
          id: crypto.randomUUID(),
          title,
          artist,
          art: "lilac",
          length: "—",
        };
        db.tracks.push(item);
        write(db);
      }
      return item;
    },
    async matches() {
      const db = read(),
        me = ready(db);
      return db.users
        .filter(
          (u) => u.id !== me.id && u.taste.public && completeTaste(u.taste),
        )
        .map((u) => compare(me, u, db))
        .sort((a, b) => b.score - a.score);
    },
    async match(id) {
      const db = read(),
        me = ready(db);
      if (id === me.id)
        throw new ApiError(400, "자신과의 궁합은 비교하지 않습니다.");
      const other = db.users.find((u) => u.id === id);
      if (!other) throw new ApiError(404, "상대 프로필을 찾을 수 없습니다.");
      return compare(me, other, db);
    },
    async discovery() {
      const db = read(),
        me = ready(db);
      const peerIds = new Set(
        db.users
          .filter(
            (u) => u.id !== me.id && u.taste.public && completeTaste(u.taste),
          )
          .flatMap((u) => u.taste.tracks),
      );
      const suggested = db.tracks.filter(
        (t) => peerIds.has(t.id) && !me.taste.tracks.includes(t.id),
      );
      return [
        ...suggested,
        ...db.tracks.filter((t) => me.taste.tracks.includes(t.id)),
      ];
    },
    async createInvitation(consent) {
      const db = read(),
        me = ready(db);
      if (!consent || !me.taste.public)
        throw new ApiError(
          403,
          "취향 공개와 친구 비교에 동의해야 초대할 수 있습니다.",
        );
      const inv: LocalInvitation = {
        token: crypto.randomUUID(),
        inviterId: me.id,
        inviterName: me.nickname,
        recipientId: null,
        inviterConsent: true,
        recipientConsent: false,
        expiresAt: new Date(now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      db.invitations.push(inv);
      write(db);
      return { ...inv, status: "WAITING" };
    },
    async invitation(token) {
      const db = read(),
        inv = findInvitation(token, db);
      return { ...inv, status: invitationStatus(inv, db) };
    },
    async acceptInvitation(token, consent) {
      const db = read(),
        me = ready(db),
        inv = findInvitation(token, db);
      if (invitationStatus(inv, db) === "EXPIRED")
        throw new ApiError(410, "초대 링크가 만료되었습니다.");
      if (inv.inviterId === me.id)
        throw new ApiError(
          400,
          "내 초대는 친구가 참여할 때까지 기다려 주세요.",
        );
      if (inv.recipientId && inv.recipientId !== me.id)
        throw new ApiError(403, "이미 다른 친구가 참여한 초대입니다.");
      if (!consent || !me.taste.public)
        throw new ApiError(403, "취향 공개와 비교에 동의해 주세요.");
      inv.recipientId = me.id;
      inv.recipientConsent = true;
      write(db);
      return { ...inv, status: invitationStatus(inv, db) };
    },
    async compareInvitation(token) {
      const db = read(),
        me = ready(db),
        inv = findInvitation(token, db);
      if (me.id !== inv.inviterId && me.id !== inv.recipientId)
        throw new ApiError(403, "초대에 참여한 두 사람만 비교할 수 있습니다.");
      const status = invitationStatus(inv, db);
      if (status !== "READY")
        throw new ApiError(
          status === "EXPIRED" ? 410 : status === "NEEDS_CONSENT" ? 403 : 409,
          status === "EXPIRED"
            ? "초대 링크가 만료되었습니다."
            : "친구의 취향 작성과 양쪽 동의를 기다리고 있어요.",
        );
      const partner = db.users.find(
        (u) =>
          u.id === (inv.inviterId === me.id ? inv.recipientId : inv.inviterId),
      )!;
      return compare(me, partner, db);
    },
    async sendInterest(to, note) {
      const db = read(),
        me = ready(db),
        other = db.users.find((u) => u.id === to);
      if (to === me.id)
        throw new ApiError(400, "자신에게 관심 요청을 보낼 수 없습니다.");
      if (!other) throw new ApiError(404, "상대를 찾을 수 없습니다.");
      if (!other.taste.public || !completeTaste(other.taste))
        throw new ApiError(
          403,
          "상대의 공개 취향 프로필이 준비되지 않았습니다.",
        );
      if (
        db.interests.some(
          (r) =>
            (r.senderId === me.id && r.recipientId === to) ||
            (r.senderId === to && r.recipientId === me.id),
        )
      )
        throw new ApiError(
          409,
          "이미 대기·처리된 요청이 있습니다. 받은 요청과 보낸 요청을 확인해 주세요.",
        );
      if (note.trim().length > 140)
        throw new ApiError(400, "관심 메시지는 140자 이하로 입력해 주세요.");
      const request: Interest = {
        id: crypto.randomUUID(),
        senderId: me.id,
        recipientId: to,
        senderName: me.nickname,
        recipientName: other.nickname,
        note: note.trim(),
        status: "PENDING",
        createdAt: new Date(now()).toISOString(),
      };
      db.interests.push(request);
      write(db);
      return request;
    },
    async interests(kind) {
      const db = read(),
        me = active(db);
      return db.interests
        .filter((r) =>
          kind === "sent" ? r.senderId === me.id : r.recipientId === me.id,
        )
        .reverse();
    },
    async actOnInterest(id, action) {
      const db = read(),
        me = active(db),
        request = db.interests.find((r) => r.id === id);
      if (!request) throw new ApiError(404, "요청을 찾을 수 없습니다.");
      if (
        action === "cancel"
          ? request.senderId !== me.id
          : request.recipientId !== me.id
      )
        throw new ApiError(403, "이 요청을 처리할 권한이 없습니다.");
      if (request.status !== "PENDING")
        throw new ApiError(
          409,
          "이미 처리된 요청입니다. 목록을 새로고침해 주세요.",
        );
      request.status =
        action === "accept"
          ? "ACCEPTED"
          : action === "reject"
            ? "REJECTED"
            : "CANCELLED";
      if (
        action === "accept" &&
        !db.connections.some((c) => c.requestId === id)
      )
        db.connections.push({
          id: crypto.randomUUID(),
          userA: request.senderId,
          userB: request.recipientId,
          requestId: id,
        });
      write(db);
      return request;
    },
    async connections() {
      const db = read(),
        me = active(db);
      return db.connections
        .filter((c) => c.userA === me.id || c.userB === me.id)
        .map((c) => {
          const partner = db.users.find(
            (u) => u.id === (c.userA === me.id ? c.userB : c.userA),
          )!;
          return {
            ...c,
            partner: { id: partner.id, nickname: partner.nickname },
          };
        });
    },
  };
}
