/**
 * Wrapper tipado em torno da Evolution API.
 *
 * Endpoints documentados em https://doc.evolution-api.com.
 * Em produção, headers e baseURL vêm de variáveis Vercel.
 */

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
  /** Fetch injetável para facilitar testes. */
  fetchImpl?: typeof fetch;
}

export interface EvolutionSendTextInput {
  /** E.164 sem `+` (padrão Evolution). Ex: `5571987654321`. */
  telefone: string;
  mensagem: string;
}

export interface EvolutionSendTextResult {
  msgId: string;
  raw: unknown;
}

export type EvolutionConnectionState =
  | "open"
  | "connecting"
  | "close"
  | "unknown";

export interface EvolutionInstanceStatus {
  state: EvolutionConnectionState;
  raw: unknown;
}

export class EvolutionApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "EvolutionApiError";
  }
}

/**
 * Lê config das env vars padrão da Sprint 5.
 * Lança se algo essencial estiver ausente — chamadores devem proteger.
 */
export function evolutionConfigFromEnv(): EvolutionConfig {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;
  if (!baseUrl || !apiKey || !instance) {
    throw new EvolutionApiError(
      "Variáveis EVOLUTION_API_URL/EVOLUTION_API_KEY/EVOLUTION_INSTANCE_NAME ausentes",
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, instance };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

interface RequestOptions {
  retries?: number;
  baseDelayMs?: number;
}

async function request<T>(
  config: EvolutionConfig,
  path: string,
  init: RequestInit,
  { retries = 3, baseDelayMs = 250 }: RequestOptions = {},
): Promise<T> {
  const fetcher = config.fetchImpl ?? fetch;
  const url = `${config.baseUrl}${path}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await fetcher(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
          ...(init.headers ?? {}),
        },
      });
      if (!res.ok) {
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          body = await res.text().catch(() => null);
        }
        if (res.status >= 500 && attempt < retries - 1) {
          lastError = new EvolutionApiError(
            `Evolution ${res.status}`,
            res.status,
            body,
          );
        } else {
          throw new EvolutionApiError(
            `Evolution ${res.status}`,
            res.status,
            body,
          );
        }
      } else {
        return (await res.json()) as T;
      }
    } catch (err) {
      lastError = err;
      if (err instanceof EvolutionApiError && err.status && err.status < 500) {
        throw err;
      }
      if (attempt === retries - 1) break;
      await delay(baseDelayMs * 2 ** attempt);
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new EvolutionApiError("Falha desconhecida na Evolution API");
}

interface SendTextResponse {
  key?: { id?: string };
  messageId?: string;
  id?: string;
  message?: { id?: string };
  [key: string]: unknown;
}

function extractMsgId(body: SendTextResponse): string {
  return (
    body.key?.id ??
    body.messageId ??
    body.id ??
    body.message?.id ??
    ""
  );
}

interface ConnectionStateResponse {
  instance?: { state?: EvolutionConnectionState; status?: string };
  state?: EvolutionConnectionState;
  status?: string;
  [key: string]: unknown;
}

function normalizeState(value: unknown): EvolutionConnectionState {
  if (value === "open" || value === "connecting" || value === "close") {
    return value;
  }
  return "unknown";
}

export function createEvolutionClient(config: EvolutionConfig) {
  return {
    async sendText(input: EvolutionSendTextInput): Promise<EvolutionSendTextResult> {
      const body = await request<SendTextResponse>(
        config,
        `/message/sendText/${encodeURIComponent(config.instance)}`,
        {
          method: "POST",
          body: JSON.stringify({
            number: input.telefone,
            text: input.mensagem,
          }),
        },
      );
      return { msgId: extractMsgId(body), raw: body };
    },

    async getInstanceStatus(): Promise<EvolutionInstanceStatus> {
      const body = await request<ConnectionStateResponse>(
        config,
        `/instance/connectionState/${encodeURIComponent(config.instance)}`,
        { method: "GET" },
        { retries: 1 },
      );
      const candidate =
        body.instance?.state ?? body.state ?? body.instance?.status ?? body.status;
      return { state: normalizeState(candidate), raw: body };
    },
  };
}

export type EvolutionClient = ReturnType<typeof createEvolutionClient>;
