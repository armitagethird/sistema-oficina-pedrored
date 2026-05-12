import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://sistema-oficina-pedrored.vercel.app";

  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos_loja")
    .select("slug, atualizado_em")
    .eq("status", "ativo");

  const produtosUrls = (data ?? []).map((p) => ({
    url: `${base}/produto/${p.slug}`,
    lastModified: p.atualizado_em ? new Date(p.atualizado_em) : new Date(),
    priority: 0.7,
  }));

  return [
    { url: `${base}/`, lastModified: new Date(), priority: 1 },
    { url: `${base}/produtos`, lastModified: new Date(), priority: 0.9 },
    ...produtosUrls,
  ];
}
