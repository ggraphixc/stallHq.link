import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Read-only public data — use the anon key (RLS-respecting), not the service
  // role key. Avoids shipping a privileged credential into the sitemap path.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/auth/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/upgrade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic store pages
  const { data: stores } = await supabase
    .from("stores")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  const storePages: MetadataRoute.Sitemap = (stores || []).map((store) => ({
    url: `${BASE_URL}/${store.slug}`,
    lastModified: new Date(store.updated_at || new Date()),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic product pages
  const { data: products } = await supabase
    .from("products")
    .select("id, store_id, updated_at, stores!inner(slug)")
    .order("updated_at", { ascending: false });

  const productPages: MetadataRoute.Sitemap = (products || []).map((product: any) => ({
    url: `${BASE_URL}/${product.stores.slug}/product/${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...storePages, ...productPages];
}
