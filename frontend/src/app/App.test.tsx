import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { api } from "../api";
import { actor, validTaste } from "../test/helpers";
import { catalogArtists, catalogTracks } from "../features/catalog";

const open = (path: string) => {
  window.history.replaceState(null, "", `/#${path}`);
  return render(<App />);
};
async function signIn(email = "a@example.com", complete = true) {
  await api.signup({
    email,
    nickname: email.split("@")[0],
    password: "demo-password-123",
  });
  if (complete) await api.saveTaste(validTaste());
}
const go = async (path: string) => {
  await act(async () => {
    window.location.hash = path;
  });
};

describe("front-end route and interaction flows", () => {
  it("protects direct routes and sends incomplete users to onboarding", async () => {
    let view = open("/home");
    expect(await screen.findByLabelText("이메일")).toBeVisible();
    expect(window.location.hash).toBe("#/login");
    view.unmount();
    await signIn("a@example.com", false);
    view = open("/discover");
    expect(
      await screen.findByRole("button", { name: /좋아하는 것부터 시작하기/ }),
    ).toBeVisible();
    expect(window.location.hash).toBe("#/onboarding/intro");
  });

  it("signs up, saves each onboarding stage, and returns to an invitation after the result", async () => {
    const user = userEvent.setup();
    open("/login?next=%2Finvite%2Ftest-token");
    await user.click(await screen.findByRole("button", { name: "회원가입" }));
    await user.type(screen.getByLabelText("닉네임"), "새리스너");
    await user.type(screen.getByLabelText("이메일"), "new@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "demo-password-123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: /내 취향으로 시작하기/ }),
    );
    await user.click(
      await screen.findByRole("button", { name: /좋아하는 것부터 시작하기/ }),
    );
    const next = await screen.findByRole("button", { name: /다음으로/ });
    expect(next).toBeDisabled();
    for (const a of catalogArtists.slice(0, 5))
      await user.click(
        screen.getByRole("button", { name: new RegExp(a.name) }),
      );
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(5);
    await user.click(next);
    await screen.findByRole("button", { name: /seasons/ });
    expect((await api.profile()).taste.artists).toHaveLength(5);
    for (const t of catalogTracks.slice(0, 10))
      await user.click(
        screen.getByRole("button", { name: (name) => name.includes(t.title) }),
      );
    await user.click(screen.getByRole("button", { name: /다음으로/ }));
    await user.click(await screen.findByRole("button", { name: "Indie" }));
    await user.click(screen.getByRole("button", { name: "몽환적인" }));
    expect(screen.getByRole("switch")).not.toBeChecked();
    await user.click(screen.getByRole("switch"));
    await user.click(
      screen.getByRole("button", { name: /나의 취향 완성하기/ }),
    );
    expect(
      await screen.findByRole(
        "link",
        { name: /친구 초대로 돌아가기/ },
        { timeout: 4000 },
      ),
    ).toHaveAttribute("href", "#/invite/test-token");
    expect((await api.profile()).complete).toBe(true);
    expect((await api.profile()).taste.public).toBe(true);
  }, 15000);

  it("shows zero candidates and usable solo/invitation paths for one actual account", async () => {
    await signIn();
    const user = userEvent.setup();
    open("/discover");
    expect(
      await screen.findByRole("heading", { name: "아직 닿지 않은 주파수." }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /친구 초대/ })).toHaveAttribute(
      "href",
      "#/invite",
    );
    await user.click(screen.getByRole("link", { name: /혼자 탐색/ }));
    expect(
      await screen.findByRole("heading", { name: /누구와 비교하지 않아도/ }),
    ).toBeVisible();
    expect(await api.matches()).toEqual([]);
  });

  it("restores persisted selections, updates privacy, and starts empty after taste deletion", async () => {
    await signIn();
    const user = userEvent.setup();
    open("/onboarding/artists");
    await screen.findByRole("button", { name: /다음으로/ });
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(5);
    await go("/my");
    await user.click(await screen.findByRole("switch"));
    await waitFor(async () =>
      expect((await api.profile()).taste.public).toBe(false),
    );
    await user.click(screen.getByRole("button", { name: "내 취향 삭제" }));
    await user.click(screen.getByRole("button", { name: /취향 삭제 확인/ }));
    await user.click(
      await screen.findByRole("button", { name: /좋아하는 것부터 시작하기/ }),
    );
    expect(
      await screen.findByRole("button", { name: /다음으로/ }),
    ).toBeDisabled();
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect((await api.profile()).taste.tracks).toEqual([]);
  });

  it("receives and accepts a real locally-created interest, with one connection", async () => {
    const a = await actor("a@example.com", localStorage);
    await signIn("b@example.com");
    const b = (await api.me())!;
    await a.api.sendInterest(b.id, "같이 들어요");
    const user = userEvent.setup();
    open("/interests/inbox");
    expect(await screen.findByText("“같이 들어요”")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "수락" }));
    expect(await screen.findByText("ACCEPTED")).toBeVisible();
    expect(window.location.hash).toBe("#/connections");
    expect(await api.connections()).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "수락" }),
    ).not.toBeInTheDocument();
  });

  it("refreshes conflicting interest state and shows 409 without creating a connection", async () => {
    const a = await actor("a@example.com", localStorage);
    await signIn("b@example.com");
    await a.api.sendInterest((await api.me())!.id, "충돌 테스트");
    const user = userEvent.setup();
    open("/interests/inbox");
    const accept = await screen.findByRole("button", { name: "수락" });
    const request = (await a.api.interests("sent"))[0];
    await a.api.actOnInterest(request.id, "cancel");
    await user.click(accept);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "최신 상태를 확인해 주세요.",
    );
    expect(await screen.findByText("취소됨")).toBeVisible();
    expect(await api.connections()).toEqual([]);
  });

  it("joins an invitation only after explicit consent and blocks private profile detail", async () => {
    const a = await actor("a@example.com", localStorage);
    const inv = await a.api.createInvitation(true);
    await signIn("b@example.com");
    const user = userEvent.setup();
    open(`/invite/${inv.token}`);
    expect(
      await screen.findByRole("button", { name: /비교에 참여하기/ }),
    ).toBeDisabled();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /비교에 참여하기/ }));
    expect(
      await screen.findByRole("heading", { name: /우리 사이의 교집합/ }),
    ).toBeVisible();
    await a.api.saveTaste(validTaste(false));
    await go(`/people/${a.user.id}`);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "공개 범위와 권한을 확인해 주세요.",
    );
    expect(
      screen.queryByRole("heading", { name: "a" }),
    ).not.toBeInTheDocument();
  });

  it("recovers a failed form without discarding input", async () => {
    const user = userEvent.setup();
    open("/login");
    await user.type(
      await screen.findByLabelText("이메일"),
      "missing@example.com",
    );
    await user.type(screen.getByLabelText("비밀번호"), "bad-password");
    await user.click(screen.getByRole("button", { name: /이어 듣기/ }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.getByLabelText("이메일")).toHaveValue("missing@example.com");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("bad-password");
    expect(screen.getByRole("button", { name: /이어 듣기/ })).toBeEnabled();
    expect(await api.me()).toBeNull();
  });

  it("logs out from My Taste and clears a session on protected API 401", async () => {
    await signIn();
    const user = userEvent.setup();
    const view = open("/my");
    await user.click(await screen.findByRole("button", { name: /로그아웃/ }));
    await waitFor(() => expect(window.location.hash).toBe("#/login"));
    expect(await api.me()).toBeNull();
    await go("/home");
    await waitFor(() => expect(screen.getByLabelText("이메일")).toBeVisible());
    view.unmount();
    await signIn("b@example.com");
    open("/home");
    await screen.findByRole("heading", { name: /b님의 지금/ });
    sessionStorage.removeItem("tunit-browser-demo-session");
    await go("/discover");
    expect(await screen.findByLabelText("이메일")).toBeVisible();
    expect(window.location.hash).toBe("#/login");
  });

  it("keeps the music list when following external links and offers an accessible fallback", async () => {
    await signIn();
    const user = userEvent.setup();
    open("/music");
    const link = await screen.findByRole("link", {
      name: /외부 음악 서비스에서 듣기/,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await user.click(
      screen.getByRole("button", { name: /외부 링크가 열리지 않나요/ }),
    );
    expect(screen.getByLabelText("외부 음악 검색 주소")).toHaveValue(
      link.getAttribute("href"),
    );
    expect(
      screen.getByRole("link", { name: "seasons 외부 음악 검색" }),
    ).toBeVisible();
  });

  it("continues with the saved basic profile when the analysis view is offline", async () => {
    await signIn();
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    const user = userEvent.setup();
    open("/onboarding/analyzing");
    await user.click(
      await screen.findByRole(
        "button",
        { name: /기본 취향으로 계속/ },
        { timeout: 3000 },
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /당신의 취향은/ }),
    ).toBeVisible();
    expect((await api.profile()).analysis).toBe("basic");
  });

  it("does not open a future conversation for a nonexistent connection", async () => {
    await signIn();
    open("/chat/not-a-connection");
    expect(
      await screen.findByRole("heading", {
        name: "상호 연결 후에 열리는 화면입니다.",
      }),
    ).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
