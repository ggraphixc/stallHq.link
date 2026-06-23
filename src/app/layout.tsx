import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "stallHq - Digital Storefronts for WhatsApp Vendors",
    template: "%s | stallHq",
  },
  description:
    "Turn your WhatsApp into a powerful storefront. Zero hosting costs, instant setup. Create your free digital store in minutes.",
  keywords: [
    "WhatsApp store",
    "digital storefront",
    "online store",
    "Nigeria",
    "Africa",
    "e-commerce",
    "WhatsApp business",
    "sell online",
    "stallhq",
  ],
  openGraph: {
    title: "stallHq - Digital Storefronts for WhatsApp Vendors",
    description:
      "Turn your WhatsApp into a powerful storefront. Zero hosting costs, instant setup.",
    url: "https://hqlink.vercel.app",
    siteName: "stallHq",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "stallHq - Digital Storefronts",
    description:
      "Turn your WhatsApp into a powerful storefront. Zero hosting costs, instant setup.",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://hqlink.vercel.app"),
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
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body>
        {children}
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
