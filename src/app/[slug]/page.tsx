import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getStoreBySlug, getProductsByStoreId } from "@/lib/supabase";
import { StorePage } from "@/components/StorePage";
import {
  generateStoreSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateStoreAEOContent,
  generateGeoMeta,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await getStoreBySlug(slug);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
    const ogImageUrl = `${baseUrl}/api/og?slug=${slug}`;
    const geo = generateGeoMeta(store);

    const channelKeywords = [
      store.whatsapp_number ? "WhatsApp shopping" : null,
      store.instagram_handle ? "Instagram shopping" : null,
    ].filter(Boolean);

    const channelList = [
      store.whatsapp_number ? "WhatsApp" : null,
      store.instagram_handle ? "Instagram" : null,
    ].filter(Boolean);

    return {
      title: `${store.name} — Shop on ${channelList.join(" & ") || "stallHq"}`,
      description:
        store.description ||
        `${store.name} — browse ${store.product_count || 0} products on stallHq. Order via ${channelList.join(" and ") || "the store"}. Free digital storefront for ${store.city || "Nigeria"} vendors.`,
      keywords: [
        store.name,
        "stallhq",
        "digital store",
        "online store",
        "WhatsApp store",
        "Instagram store",
        store.city,
        store.state,
        store.country || "Nigeria",
        store.category,
        "buy online",
        "shop online",
        ...channelKeywords,
      ].filter(Boolean),
      openGraph: {
        title: `${store.name} — stallHq Store`,
        description:
          store.description ||
          `Shop from ${store.name} on stallHq. Browse products and order via ${channelList.join(" and ") || "the store"}.`,
        url: `${baseUrl}/${store.slug}`,
        siteName: "stallHq",
        images: [
          {
            url: store.banner_url || ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${store.name} — stallHq`,
          },
        ],
        locale: "en_NG",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${store.name} — stallHq`,
        description:
          store.description ||
          `Shop from ${store.name} on stallHq.`,
        images: [store.banner_url || ogImageUrl],
      },
      alternates: {
        canonical: `${baseUrl}/${store.slug}`,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      other: geo,
    };
  } catch {
    return {
      title: "Store Not Found | stallHq",
      description: "This store does not exist or has been removed.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function StoreRoute({ params }: PageProps) {
  const { slug } = await params;

  try {
    const store = await getStoreBySlug(slug);
    const products = await getProductsByStoreId(store.id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";

    // Comprehensive structured data
    const storeSchema = generateStoreSchema(store);
    const productSchemas = products.map((p) => generateProductSchema(p, store));
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: "stallHq", url: "/" },
      { name: "Explore", url: "/explore" },
      { name: store.name, url: `/${store.slug}` },
    ]);
    const aeoContent = generateStoreAEOContent(store);

    return (
      <>
        {/* Structured Data: Store as LocalBusiness (GEO + AEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
        {/* Structured Data: Products */}
        {productSchemas.map((schema, i) => (
          <script
            key={`product-schema-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {/* Structured Data: Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {/* AEO: Machine-readable page summary */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aeoContent) }}
        />
        <StorePage store={store} products={products} />
      </>
    );
  } catch {
    notFound();
  }
}
