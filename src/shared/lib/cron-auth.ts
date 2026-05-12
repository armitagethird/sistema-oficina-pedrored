/**
 * Cron auth — valida `Authorization: Bearer ${CRON_SECRET}` em routes chamadas pelo Vercel Cron.
 * Vercel Cron sempre injeta o header se o env var existir, então uma rota cron-only fica blindada.
 */

export class CronAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CronAuthError";
  }
}

export function assertCronAuth(req: Request): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new CronAuthError("CRON_SECRET não configurado");
  }

  const header = req.headers.get("authorization");
  if (!header || header !== `Bearer ${secret}`) {
    throw new CronAuthError("não autorizado");
  }
}
