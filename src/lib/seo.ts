import { Store, Product } from "@/types";

const SITE_URL = "https://hqlink.vercel.app";
const SITE_NAME = "stallHq";
const SITE_DESCRIPTION = "Digital storefronts for WhatsApp & Instagram vendors. Zero hosting costs, instant setup.";

// Extended store type with optional geo fields from Supabase
type StoreWithGeo = Store & {
  country?: string;
  city?: string;
  state?: string;
  latitude?: number | string;
  longitude?: number | string;
  address?: string;
  phone?: string;
  location?: string;
  opening_hours?: string;
  rating_count?: number;
  average_rating?: number;
  product_count?: number;
};

// Extended product type with optional rating/review fields
type ProductWithRatings = Product & {
  rating_count?: number;
  average_rating?: number;
  sku?: string;
  reviews?: Array<{
    customer_name?: string;
    rating: number;
    comment?: string;
    created_at: string;
  }>;
};

// ─── GEO Meta Tags ────────────────────────────────────────────
export function generateGeoMeta(store?: StoreWithGeo) {
  const region = store?.country || "NG";
  const city = store?.city || "Nigeria";
  const lat = store?.latitude || "6.5244";
  const lng = store?.longitude || "3.3792";

  return {
    "geo.region": region,
    "geo.placename": city,
    "geo.position": `${lat};${lng}`,
    ICBM: `${lat}, ${lng}`,
  };
}

// ─── Organization Schema (stallHq platform) ──────────────────
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-192.svg`,
    description: SITE_DESCRIPTION,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
    },
  };
}

// ─── WebSite Schema (AEO - helps AI engines understand the site) ──
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: `${SITE_URL}/icons/icon-192.svg`,
    },
  };
}

// ─── Store / LocalBusiness Schema (GEO + AEO) ────────────────
export function generateStoreSchema(store: StoreWithGeo) {
  const storeUrl = `${SITE_URL}/${store.slug}`;
  const contactMethods: string[] = [];
  if (store.whatsapp_number) contactMethods.push(`WhatsApp: ${store.whatsapp_number}`);
  if (store.instagram_handle) contactMethods.push(`Instagram: @${store.instagram_handle}`);
  if (store.email) contactMethods.push(`Email: ${store.email}`);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    description: store.description || `${store.name} — digital storefront on ${SITE_NAME}`,
    url: storeUrl,
    image: store.banner_url || store.logo_url || `${SITE_URL}/icons/icon-192.svg`,
    ...(store.logo_url && { logo: store.logo_url }),
    ...(store.phone && { telephone: store.phone }),
    ...(store.email && { email: store.email }),
    ...(store.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: store.address,
        addressLocality: store.city || "",
        addressRegion: store.state || "",
        addressCountry: store.country || "NG",
      },
    }),
    ...(store.latitude &&
      store.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: parseFloat(String(store.latitude)),
          longitude: parseFloat(String(store.longitude)),
        },
      }),
    ...(store.opening_hours && {
      openingHoursSpecification: parseOpeningHours(store.opening_hours),
    }),
    areaServed: {
      "@type": "Country",
      name: store.country || "Nigeria",
    },
    contactPoint: contactMethods.length
      ? {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableChannel: contactMethods.map((m) => ({
            "@type": "ServiceChannel",
            servicePhone: m,
          })),
        }
      : undefined,
    parentOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    aggregateRating: store.rating_count
      ? {
          "@type": "AggregateRating",
          ratingValue: store.average_rating || 0,
          reviewCount: store.rating_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}

// ─── Product Schema (AEO - rich snippets for AI + search) ─────
export function generateProductSchema(product: ProductWithRatings, store: StoreWithGeo) {
  const productUrl = `${SITE_URL}/${store.slug}/product/${product.id}`;
  const imageUrls = product.images?.length
    ? product.images
    : product.image_url
      ? [product.image_url]
      : [];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} from ${store.name}`,
    url: productUrl,
    image: imageUrls,
    brand: {
      "@type": "Brand",
      name: store.name,
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "NGN",
      availability: product.in_stock !== false
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
      seller: {
        "@type": "Organization",
        name: store.name,
        url: `${SITE_URL}/${store.slug}`,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: store.country || "NG",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
    },
    aggregateRating: product.rating_count
      ? {
          "@type": "AggregateRating",
          ratingValue: product.average_rating || 0,
          reviewCount: product.rating_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    review: product.reviews?.length
      ? product.reviews.slice(0, 5).map((r) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: r.customer_name || "Anonymous",
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
          },
          reviewBody: r.comment || "",
          datePublished: r.created_at,
        }))
      : undefined,
    category: product.category || undefined,
    gtin: product.sku || undefined,
  };
}

// ─── BreadcrumbList Schema ────────────────────────────────────
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

// ─── FAQ Schema (AEO - AI engines love FAQ structured data) ───
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─── HowTo Schema (AEO - for onboarding/setup content) ───────
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

// ─── SoftwareApplication Schema (AEO for the platform) ───────
export function generateAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 4.8,
      ratingCount: 100,
      bestRating: 5,
    },
  };
}

// ─── AEO Content Helpers ──────────────────────────────────────
// These produce machine-readable summaries that AI engines can cite

export function generateStoreAEOContent(store: StoreWithGeo) {
  const channels: string[] = [];
  if (store.whatsapp_number) channels.push("WhatsApp");
  if (store.instagram_handle) channels.push("Instagram");

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${store.name} — Store on ${SITE_NAME}`,
    description: store.description || `${store.name} sells products on ${SITE_NAME}. Order via ${channels.join(" and ") || "the store"}.`,
    url: `${SITE_URL}/${store.slug}`,
    about: {
      "@type": "LocalBusiness",
      name: store.name,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${store.name} Products`,
      numberOfItems: store.product_count || 0,
    },
  };
}

export function generateProductAEOContent(product: ProductWithRatings, store: StoreWithGeo) {
  const channels: string[] = [];
  if (store.whatsapp_number) channels.push("WhatsApp");
  if (store.instagram_handle) channels.push("Instagram");

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${product.name} — from ${store.name} on ${SITE_NAME}`,
    description: `${product.name} priced at ₦${product.price.toLocaleString()}. ${product.description || `Available from ${store.name}.`}${channels.length ? ` Order via ${channels.join(" and ")}.` : ""}`,
    url: `${SITE_URL}/${store.slug}/product/${product.id}`,
    about: {
      "@type": "Product",
      name: product.name,
    },
    mainEntity: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "NGN",
      availability: product.in_stock !== false
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────
function parseOpeningHours(hours: string) {
  try {
    const parsed = JSON.parse(hours);
    if (Array.isArray(parsed)) {
      return parsed.map((h: { day?: string; open?: string; close?: string }) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.day || "Monday",
        opens: h.open || "09:00",
        closes: h.close || "17:00",
      }));
    }
  } catch {
    // If it's a simple string like "Mon-Fri: 9am-5pm"
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    };
  }
  return undefined;
}

// ─── Robots Directives ────────────────────────────────────────
export function generateRobotsMeta() {
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}
