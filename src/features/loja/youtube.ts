import "server-only";

export type VideoYoutube = {
  id: string;
  titulo: string;
  thumbnail: string;
  publicadoEm: string;
  url: string;
};

const ENTRY_RE = /<entry>([\s\S]*?)<\/entry>/g;
const VIDEO_ID_RE = /<yt:videoId>([^<]+)<\/yt:videoId>/;
const TITLE_RE = /<title>([^<]+)<\/title>/;
const PUBLISHED_RE = /<published>([^<]+)<\/published>/;
const THUMB_RE = /<media:thumbnail\s+url="([^"]+)"/;

export function parseFeed(xml: string): VideoYoutube[] {
  if (!xml) return [];

  const videos: VideoYoutube[] = [];
  const matches = xml.matchAll(ENTRY_RE);

  for (const entryMatch of matches) {
    const block = entryMatch[1] ?? "";
    const id = block.match(VIDEO_ID_RE)?.[1];
    const titulo = block.match(TITLE_RE)?.[1];
    const publicadoEm = block.match(PUBLISHED_RE)?.[1];
    const thumbnail = block.match(THUMB_RE)?.[1];

    if (!id || !titulo || !publicadoEm || !thumbnail) continue;

    videos.push({
      id,
      titulo: decodeXmlEntities(titulo),
      thumbnail,
      publicadoEm,
      url: `https://www.youtube.com/watch?v=${id}`,
    });
  }

  return videos;
}

export async function getUltimosVideos(
  channelId: string,
  limit = 3,
): Promise<VideoYoutube[]> {
  if (!channelId) return [];

  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return [];

    const xml = await response.text();
    return parseFeed(xml).slice(0, limit);
  } catch (error) {
    console.error("[youtube] falha ao buscar feed:", error);
    return [];
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
