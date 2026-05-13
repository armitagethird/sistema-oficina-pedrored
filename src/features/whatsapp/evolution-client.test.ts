import { describe, expect, it, vi } from "vitest";

import {
  EvolutionApiError,
  createEvolutionClient,
  type EvolutionConfig,
} from "./evolution-client";

function makeConfig(fetchImpl: typeof fetch): EvolutionConfig {
  return {
    baseUrl: "https://wa.test.local",
    apiKey: "test-key",
    instance: "pedrored",
    fetchImpl,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("evolution-client.sendText", () => {
  it("chama endpoint /message/sendText/{instance} com apikey + body correto", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { key: { id: "msg-1" }, ok: true }));
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));

    const result = await client.sendText({
      telefone: "5571999999999",
      mensagem: "oi",
    });

    expect(result.msgId).toBe("msg-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://wa.test.local/message/sendText/pedrored");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).apikey).toBe("test-key");
    expect(JSON.parse(init.body as string)).toEqual({
      number: "5571999999999",
      text: "oi",
    });
  });

  it("recupera msgId quando a Evolution responde em formato alternativo", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, { messageId: "abc-42" }),
    );
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));
    const r = await client.sendText({ telefone: "55", mensagem: "x" });
    expect(r.msgId).toBe("abc-42");
  });

  it("retenta em erro 500 e tem sucesso depois", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500, { error: "boom" }))
      .mockResolvedValueOnce(jsonResponse(500, { error: "boom" }))
      .mockResolvedValueOnce(jsonResponse(200, { key: { id: "ok" } }));
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));

    const r = await client.sendText({ telefone: "55", mensagem: "x" });
    expect(r.msgId).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("não retenta em 4xx — lança EvolutionApiError de imediato", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(400, { error: "telefone inválido" }));
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));

    await expect(
      client.sendText({ telefone: "0", mensagem: "x" }),
    ).rejects.toBeInstanceOf(EvolutionApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falha após esgotar retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(503, { error: "down" }));
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));

    await expect(
      client.sendText({ telefone: "55", mensagem: "x" }),
    ).rejects.toBeInstanceOf(EvolutionApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("evolution-client.getInstanceStatus", () => {
  it("normaliza resposta para estado conhecido", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { instance: { state: "open" } }));
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));

    const s = await client.getInstanceStatus();
    expect(s.state).toBe("open");
  });

  it("retorna 'unknown' para resposta inesperada", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(200, { foo: 1 }));
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));

    const s = await client.getInstanceStatus();
    expect(s.state).toBe("unknown");
  });

  it("aceita formato com state no nível raiz", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, { state: "connecting" }),
    );
    const client = createEvolutionClient(makeConfig(fetchMock as unknown as typeof fetch));
    const s = await client.getInstanceStatus();
    expect(s.state).toBe("connecting");
  });
});
