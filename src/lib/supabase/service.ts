import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Cliente Supabase com service_role — bypassa RLS.
 * Use APENAS em server actions e route handlers onde a autorização é checada
 * em código (ex: validar telefone do cliente antes de mostrar pedido).
 *
 * NÃO USE em queries chamadas direto de páginas — prefira `createClient` do
 * `server.ts` (usa cookies do user logado).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createServiceClient: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
