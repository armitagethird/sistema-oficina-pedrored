import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://sistema-oficina-pedrored.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app",
        "/app/",
        "/checkout/pagamento",
        "/pedido/",
        "/api/",
        "/login",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
