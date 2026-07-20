import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evercoolthailand.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Gracefully skip DB fetch if service role key is not configured (local builds)
  let articles: { slug: string; updated_at: string | null }[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("articles")
      .select("slug, updated_at")
      .eq("is_published", true);
    articles = data ?? [];
  } catch {
    // no-op - service role key not available in local build
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/quote`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/learn`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${BASE_URL}/learn/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at as string) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
