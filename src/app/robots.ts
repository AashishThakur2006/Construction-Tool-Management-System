import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [{ userAgent: "*", allow: ["/", "/about", "/people", "/pricing"], disallow: ["/app", "/api/", "/auth/"] }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
