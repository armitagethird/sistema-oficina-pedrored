import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { assertCronAuth, CronAuthError } from "@/shared/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    assertCronAuth(req);
  } catch (err) {
    if (err instanceof CronAuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
    throw err;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("marca_pagamentos_atrasados");
  if (error) {
    console.error("marca-atrasados RPC:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, atualizados: data ?? 0 });
}
