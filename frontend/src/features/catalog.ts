export const artists = [
  { name: "wave to earth", genre: "Indie · Jazz", art: "ocean" },
  { name: "백예린", genre: "R&B · Indie", art: "flower" },
  { name: "혁오", genre: "Indie · Rock", art: "sunset" },
  { name: "NewJeans", genre: "Pop · R&B", art: "bubble" },
  { name: "검정치마", genre: "Indie · Rock", art: "night" },
  { name: "SZA", genre: "R&B · Soul", art: "water" },
  { name: "DEAN", genre: "R&B · Alternative", art: "rose" },
  { name: "Laufey", genre: "Jazz · Pop", art: "cream" },
  { name: "잔나비", genre: "Indie · Rock", art: "forest" },
  { name: "Frank Ocean", genre: "R&B · Soul", art: "orange" },
  { name: "The 1975", genre: "Alternative · Pop", art: "pink" },
  { name: "아이유", genre: "Pop · Ballad", art: "lilac" },
];

export const tracks = [
  { title: "seasons", artist: "wave to earth", art: "ocean", length: "4:15" },
  { title: "Square (2017)", artist: "백예린", art: "flower", length: "4:20" },
  { title: "TOMBOY", artist: "혁오", art: "sunset", length: "4:01" },
  { title: "Ditto", artist: "NewJeans", art: "bubble", length: "3:05" },
  { title: "EVERYTHING", artist: "검정치마", art: "night", length: "4:53" },
  { title: "Good Days", artist: "SZA", art: "water", length: "4:39" },
  { title: "instagram", artist: "DEAN", art: "rose", length: "4:15" },
  { title: "From The Start", artist: "Laufey", art: "cream", length: "2:49" },
  {
    title: "주저하는 연인들을 위해",
    artist: "잔나비",
    art: "forest",
    length: "4:25",
  },
  {
    title: "Pink + White",
    artist: "Frank Ocean",
    art: "orange",
    length: "3:04",
  },
  { title: "About You", artist: "The 1975", art: "pink", length: "5:26" },
  { title: "Love wins all", artist: "아이유", art: "lilac", length: "4:31" },
];

export const genres = [
  "Indie",
  "R&B",
  "Pop",
  "Rock",
  "Jazz",
  "Hip-hop",
  "Electronic",
  "Soul",
];
export const moods = [
  "몽환적인",
  "그루비한",
  "따뜻한",
  "차분한",
  "에너지 넘치는",
  "쓸쓸한",
  "청량한",
  "로맨틱한",
];

export const catalogArtists = artists.map((artist, index) => ({
  ...artist,
  id: `artist-${index}`,
}));
export const catalogTracks = tracks.map((track, index) => ({
  ...track,
  id: `track-${index}`,
}));
