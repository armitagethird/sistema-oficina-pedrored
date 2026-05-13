import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUltimosVideos, parseFeed } from "./youtube";

const FIXTURE = readFileSync(
  resolve(__dirname, "./__fixtures__/youtube-feed.xml"),
  "utf-8",
);

describe("parseFeed", () => {
  it("extrai videos do feed real do PEDRORED", () => {
    const videos = parseFeed(FIXTURE);
    expect(videos.length).toBeGreaterThanOrEqual(3);
    const primeiro = videos[0]!;
    expect(primeiro.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(primeiro.titulo.length).toBeGreaterThan(0);
    expect(primeiro.thumbnail).toMatch(/^https:\/\/i\d?\.ytimg\.com\//);
    expect(primeiro.url).toBe(`https://www.youtube.com/watch?v=${primeiro.id}`);
    expect(new Date(primeiro.publicadoEm).toString()).not.toBe("Invalid Date");
  });

  it("retorna [] para XML vazio", () => {
    expect(parseFeed("")).toEqual([]);
  });

  it("retorna [] para XML inválido sem entries", () => {
    expect(parseFeed("<feed></feed>")).toEqual([]);
  });
});

describe("getUltimosVideos", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retorna [] quando channelId é vazio sem chamar fetch", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const videos = await getUltimosVideos("", 3);
    expect(videos).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna no máximo `limit` videos do feed", async () => {
    global.fetch = vi.fn(async () =>
      new Response(FIXTURE, { status: 200 }),
    ) as unknown as typeof fetch;
    const videos = await getUltimosVideos("UCwLMc5ERhoaghTLQ0aH7buA", 3);
    expect(videos).toHaveLength(3);
  });

  it("retorna [] quando fetch responde com status não-ok", async () => {
    global.fetch = vi.fn(async () =>
      new Response("not found", { status: 404 }),
    ) as unknown as typeof fetch;
    const videos = await getUltimosVideos("UCinvalid", 3);
    expect(videos).toEqual([]);
  });

  it("retorna [] quando fetch lança erro de rede", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const videos = await getUltimosVideos("UCwLMc5ERhoaghTLQ0aH7buA", 3);
    expect(videos).toEqual([]);
  });
});
