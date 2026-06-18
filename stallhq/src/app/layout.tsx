import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "stallHq - Digital Storefronts",
  description:
    "Turn your WhatsApp into a powerful storefront. Zero hosting costs, instant setup.",
  openGraph: {
    title: "stallHq - Digital Storefronts",
    description:
      "Turn your WhatsApp into a powerful storefront. Zero hosting costs, instant setup.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      </head>
      <body>{children}</body>
    </html>
  );
}
