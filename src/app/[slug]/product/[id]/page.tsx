import { notFound } from "next/navigation";
import { getProductById } from "@/lib/supabase";
import { ProductDetail } from "./ProductDetail";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    const storeData = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    const storeName = storeData?.name || "Store";
    const storeSlug = storeData?.slug || "";
    const ogImage = `${process.env.NEXT_PUBLIC_APP_URL}/api/og?slug=${storeSlug}`;
    const productImage = product.image_url || ogImage;

    return {
      title: `${product.name} | ${storeName}`,
      description: product.description || `Shop ${product.name} from ${storeName} on StallHq — ₦${product.price.toLocaleString()}`,
      openGraph: {
        title: `${product.name} — ${storeName}`,
        description: product.description || `Shop ${product.name} from ${storeName} on StallHq`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${storeSlug}/product/${product.id}`,
        images: [
          { url: productImage, width: 1200, height: 630, alt: product.name },
        ],
        type: "website",
        siteName: "StallHq",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} — ${storeName}`,
        description: product.description || `Shop ${product.name} from ${storeName} on StallHq`,
        images: [productImage],
      },
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

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.image_url,
      url: `${baseUrl}/${storeSlug}/product/${product.id}`,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "NGN",
        availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: storeName,
        },
      },
      brand: {
        "@type": "Organization",
        name: storeName,
      },
      category: product.category,
      aggregateRating: product.avg_rating ? {
        "@type": "AggregateRating",
        ratingValue: product.avg_rating,
        reviewCount: product.review_count || 0,
      } : undefined,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ProductDetail product={product} />
      </>
    );
  } catch {
    notFound();
  }
}
