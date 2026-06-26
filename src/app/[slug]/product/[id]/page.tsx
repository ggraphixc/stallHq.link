import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProductById } from "@/lib/supabase";
import { ProductDetail } from "./ProductDetail";
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateProductAEOContent,
  generateGeoMeta,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    const storeData = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    const storeName = storeData?.name || "Store";
    const storeSlug = storeData?.slug || "";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
    const productUrl = `${baseUrl}/${storeSlug}/product/${product.id}`;
    const productImage = product.image_url || `${baseUrl}/api/og?slug=${storeSlug}`;
    const geo = generateGeoMeta(storeData);

    const channelList = [
      storeData?.whatsapp_number ? "WhatsApp" : null,
      storeData?.instagram_handle ? "Instagram" : null,
    ].filter(Boolean);

    return {
      title: `${product.name} — ₦${product.price.toLocaleString()} | ${storeName}`,
      description:
        product.description ||
        `${product.name} from ${storeName} — ₦${product.price.toLocaleString()}. ${channelList.length ? `Order via ${channelList.join(" and ")}.` : "Available on stallHq."}`,
      keywords: [
        product.name,
        storeName,
        "stallhq",
        product.category,
        "buy online",
        "shop online Nigeria",
        "WhatsApp order",
        "Instagram shop",
      ].filter(Boolean),
      openGraph: {
        title: `${product.name} — ${storeName}`,
        description:
          product.description ||
          `${product.name} — ₦${product.price.toLocaleString()} from ${storeName} on stallHq`,
        url: productUrl,
        images: [
          { url: productImage, width: 1200, height: 630, alt: product.name },
        ],
        type: "website",
        siteName: "stallHq",
        locale: "en_NG",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} — ${storeName}`,
        description:
          product.description ||
          `${product.name} — ₦${product.price.toLocaleString()} from ${storeName}`,
        images: [productImage],
      },
      alternates: {
        canonical: productUrl,
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
    return { title: "Product Not Found" };
  }
}

export default async function ProductRoute({ params }: PageProps) {
  const { id } = await params;

  try {
    const product = await getProductById(id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";

    const storeData = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    const storeName = storeData?.name || "Store";
    const storeSlug = storeData?.slug || "";

    // Build a minimal Store-like object for schema generation
    const storeForSchema = {
      ...storeData,
      name: storeName,
      slug: storeSlug,
    };

    const productSchema = generateProductSchema(product, storeForSchema);
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: "stallHq", url: "/" },
      { name: "Explore", url: "/explore" },
      { name: storeName, url: `/${storeSlug}` },
      { name: product.name, url: `/${storeSlug}/product/${product.id}` },
    ]);
    const aeoContent = generateProductAEOContent(product, storeForSchema);

    return (
      <>
        {/* Structured Data: Product (rich snippets) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        {/* Structured Data: Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {/* AEO: Machine-readable product summary */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aeoContent) }}
        />
        <ProductDetail product={product} />
      </>
    );
  } catch {
    notFound();
  }
}
