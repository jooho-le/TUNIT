export const INTRO_DURATION = 1800;
export const INTRO_SEEN_KEY = "tunit-brand-intro-v1";

export const stories = [
  {
    id: "taste",
    number: "01",
    label: "THE SOUND OF YOU",
    title: ["좋아하는 음악이,", "나를 말해준다면."],
    description:
      "자주 듣는 아티스트와 오래 머무는 노래. 흩어져 있던 취향을 하나의 프로필로 만나보세요.",
    detail: "아티스트 → 좋아하는 곡 → 장르와 무드",
  },
  {
    id: "twin",
    number: "02",
    label: "DIFFERENT LIVES. SAME FREQUENCY.",
    title: ["어딘가 있을,", "나와 닮은 플레이리스트."],
    description:
      "같은 노래에서 마음이 움직이는 사람. 함께 좋아하는 것부터 조금 다른 취향까지 발견해요.",
    detail: "공개한 취향으로 만나는 Music Twin",
  },
  {
    id: "discovery",
    number: "03",
    label: "YOUR NEXT FAVORITE",
    title: ["누군가의 최애가,", "나의 다음 곡으로."],
    description:
      "익숙한 재생 목록 밖으로 한 걸음. 다른 취향에서 발견한 음악을 직접 들어보세요.",
    detail: "새로운 곡 발견 → 외부 음악 서비스에서 듣기",
  },
  {
    id: "friends",
    number: "04",
    label: "A FRIEND. A NEW FREQUENCY.",
    title: ["알던 친구,", "몰랐던 취향."],
    description:
      "링크 하나로 친구를 초대하세요. 서로 준비되고 동의하면, 둘만의 음악 교집합이 열려요.",
    detail: "초대 링크 → 친구의 취향 입력 → 1:1 비교",
  },
] as const;
export type Story = (typeof stories)[number];

export function scrollToLandingSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
}
