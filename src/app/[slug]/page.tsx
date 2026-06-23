import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getStoreBySlug, getProductsByStoreId } from "@/lib/supabase";
import { StorePage } from "@/components/StorePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await getStoreBySlug(slug);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
    const ogImageUrl = `${baseUrl}/api/og?slug=${slug}`;

    return {
      title: `${store.name} | StallHq`,
      description: store.description || `Shop from ${store.name} on StallHq. Browse products and order via WhatsApp.`,
      keywords: [
        store.name,
        "stallhq",
        "digital store",
        "WhatsApp shopping",
        store.category,
        "online store",
        "Nigeria",
      ].filter(Boolean),
      openGraph: {
        title: store.name,
        description: store.description || `Shop from ${store.name}`,
        url: `${baseUrl}/${store.slug}`,
        siteName: "StallHq",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${store.name} - StallHq Store`,
          },
        ],
        locale: "en_NG",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: store.name,
        description: store.description || `Shop from ${store.name}`,
        images: [ogImageUrl],
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
    };
  } catch {
    return {
      title: "Store Not Found | StallHq",
      description: "This store does not exist or has been removed.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function StoreRoute({ params }: PageProps) {
  const { slug } = await params;

  try {
    const store = await getStoreBySlug(slug);
    const products = await getProductsByStoreId(store.id);

    // Generate structured data for SEO
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Store",
      name: store.name,
      description: store.description,
      url: `${baseUrl}/${store.slug}`,
      logo: store.logo_url,
      image: store.banner_url,
      category: store.category,
      sameAs: [],
      address: store.location ? {
        "@type": "PostalAddress",
        addressLocality: store.location,
        addressCountry: "NG",
      } : undefined,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: "English",
      },
      aggregateRating: store.avg_rating ? {
        "@type": "AggregateRating",
        ratingValue: store.avg_rating,
        reviewCount: store.review_count || 0,
      } : undefined,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <StorePage store={store} products={products} />
      </>
    );
  } catch {
    notFound();
  }
}
