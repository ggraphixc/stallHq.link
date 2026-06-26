import type { Metadata, Viewport } from "next";
import { AlertProvider } from "@/contexts/AlertContext";
import { DynamicBranding } from "@/components/DynamicBranding";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateAppSchema,
} from "@/lib/seo";
import "./globals.css";

const SITE_URL = "https://hqlink.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "stallHq — Digital Storefronts for WhatsApp & Instagram Vendors",
    template: "%s | stallHq",
  },
  description:
    "Turn your WhatsApp or Instagram into a powerful storefront. Zero hosting costs, instant setup. Create your free digital store in minutes and start selling today.",
  keywords: [
    "WhatsApp store",
    "Instagram store",
    "digital storefront",
    "online store Nigeria",
    "sell on WhatsApp",
    "sell on Instagram",
    "African e-commerce",
    "WhatsApp business store",
    "Instagram shop",
    "free online store",
    "small business Nigeria",
    "stallhq",
    "hqlink",
    "vendor platform Africa",
    "WhatsApp catalog",
    "Instagram product page",
  ],
  authors: [{ name: "stallHq" }],
  creator: "stallHq",
  publisher: "stallHq",
  openGraph: {
    title: "stallHq — Digital Storefronts for WhatsApp & Instagram Vendors",
    description:
      "Turn your WhatsApp or Instagram into a powerful storefront. Zero hosting costs, instant setup. Free to start.",
    url: SITE_URL,
    siteName: "stallHq",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/icons/icon-192.svg`,
        width: 192,
        height: 192,
        alt: "stallHq Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "stallHq — Digital Storefronts",
    description:
      "Turn your WhatsApp or Instagram into a powerful storefront. Zero hosting costs, instant setup.",
    images: [`${SITE_URL}/icons/icon-192.svg`],
  },
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
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
  alternates: {
    canonical: SITE_URL,
  },
  verification: {},
  other: {
    // GEO meta tags
    "geo.region": "NG",
    "geo.placename": "Nigeria",
    "geo.position": "6.5244;3.3792",
    ICBM: "6.5244, 3.3792",
    // AEO: machine-readable site identity
    "application-name": "stallHq",
    "msapplication-TileColor": "#0a0a0f",
    "theme-color": "#0a0a0f",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = generateOrganizationSchema();
  const siteSchema = generateWebSiteSchema();
  const appSchema = generateAppSchema();

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="icon" href="/icons/icon-192.svg" />

        {/* Structured Data: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* Structured Data: WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        {/* Structured Data: SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
      </head>
      <body>
        <DynamicBranding />
        <AlertProvider>{children}</AlertProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(err) {
                      console.log('SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
