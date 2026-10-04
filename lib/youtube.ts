const YOUTUBE_ID_PATTERNS = [
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube-nocookie\.com\/embed\/)([\w-]{11})/,
];

export function getYouTubeId(input?: string): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;

  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getYouTubeEmbedUrl(input?: string): string | null {
  const id = getYouTubeId(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}