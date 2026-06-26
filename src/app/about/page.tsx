import { Metadata } from "next";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateFAQSchema,
  generateHowToSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "About stallHq — Free Digital Storefronts for WhatsApp & Instagram",
  description:
    "stallHq is a free digital storefront platform for vendors in Nigeria and Africa. Create a professional online store, sell on WhatsApp and Instagram, with zero hosting cost.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://hqlink.vercel.app/about" },
};

const ABOUT_FAQS = [
  {
    question: "What is stallHq?",
    answer:
      "stallHq is a free digital storefront platform built for WhatsApp and Instagram vendors in Nigeria and across Africa. It gives vendors a professional online store at a custom URL (hqlink.vercel.app/your-slug), a product catalog with images and descriptions, and one-click ordering that connects customers directly to WhatsApp or Instagram to complete purchases.",
  },
  {
    question: "How does stallHq work?",
    answer:
      "Vendors sign up for free, add their store details (name, description, WhatsApp/Instagram handle), upload products with photos and prices, and get a live storefront. Customers browse the catalog, add items to cart, and are redirected to WhatsApp or Instagram with a pre-filled order message. All money and trust stays on the vendor's existing channels.",
  },
  {
    question: "Is stallHq free?",
    answer:
      "Yes, stallHq offers a free 5-day trial with up to 10 products. After the trial, paid plans start at ₦3,500/month (Monthly), ₦7,500/quarter (Quarterly), or ₦12,000 for 6 months (Best Value). There are no transaction fees — payments happen directly between vendor and customer.",
  },
  {
    question: "What countries does stallHq support?",
    answer:
      "stallHq is built for vendors in Nigeria and across Africa. The platform supports Naira (₦) pricing, works on any smartphone browser, and is designed for low-bandwidth mobile connections common across the continent.",
  },
  {
    question: "Does stallHq handle payments?",
    answer:
      "No. stallHq is a digital catalog and storefront — not a payment processor. When a customer places an order, they are directed to WhatsApp or Instagram where the vendor completes the transaction directly. This keeps things simple, trust-based, and zero-fee for the vendor.",
  },
  {
    question: "Can I customize my store?",
    answer:
      "Yes. Vendors can customize their store with a logo, banner image, store description, product categories, and store hours. Paid plans unlock additional customization like custom themes and colors. The platform uses a modern dark ambient design by default.",
  },
  {
    question: "How do customers find my store?",
    answer:
      "Your store is accessible at hqlink.vercel.app/your-slug. You can share this link on WhatsApp status, Instagram bio, business cards, QR codes, or anywhere. The platform also has an Explore page where customers can discover stores by category and location.",
  },
  {
    question: "What is AEO and why does it matter?",
    answer:
      "AEO stands for Answer Engine Optimization. It's the practice of structuring your product and store data so that AI search engines like ChatGPT, Perplexity, and Google AI Overviews can accurately describe your products to potential customers. Every stallHq store automatically includes structured data (Schema.org) that makes it AEO-ready, meaning AI assistants can recommend your products when users ask questions like 'where can I buy X in Lagos?'",
  },
  {
    question: "What is GEO and how does stallHq use it?",
    answer:
      "GEO stands for Geographic Optimization. stallHq stores include geographic metadata (coordinates, city, state, country) in their structured data, making them discoverable by location-based searches. When someone searches for 'fashion vendor in Lekki' or 'phone accessories Abuja', GEO-optimized stores are more likely to appear in results.",
  },
];

const FEATURES_HOW_TO = [
  { name: "Create your store", text: "Sign up at hqlink.vercel.app, choose your store name and URL slug, and connect your WhatsApp number or Instagram handle." },
  { name: "Add products", text: "Upload product photos, set prices in Naira, add descriptions. Use the built-in AI description generator for professional copy." },
  { name: "Share your link", text: "Share hqlink.vercel.app/your-slug on WhatsApp status, Instagram bio, or print the QR code on packaging." },
  { name: "Receive orders", text: "Customers browse, add to cart, and are redirected to WhatsApp or Instagram with a pre-filled order message." },
];

export default function AboutPage() {
  const orgSchema = generateOrganizationSchema();
  const siteSchema = generateWebSiteSchema();
  const faqSchema = generateFAQSchema(ABOUT_FAQS);
  const howToSchema = generateHowToSchema(
    "How to Sell Online with stallHq",
    "Create a free digital storefront for your WhatsApp or Instagram business in minutes.",
    FEATURES_HOW_TO
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem", lineHeight: 1.2 }}>
            stallHq — Free Digital Storefronts for WhatsApp & Instagram Vendors
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.7 }}>
            stallHq is a digital storefront platform built for vendors in Nigeria and across Africa.
            We give WhatsApp and Instagram sellers a professional online store — with a custom URL, product catalog,
            and one-click ordering — at zero hosting cost.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "2.5rem", marginBottom: "0.75rem" }}>
            How It Works
          </h2>
          <ol style={{ color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
            <li><strong>Sign up</strong> — Create your account at hqlink.vercel.app. Free trial, no credit card.</li>
            <li><strong>Add products</strong> — Upload photos, set prices, write descriptions (or use AI to generate them).</li>
            <li><strong>Share your link</strong> — Your store is live at hqlink.vercel.app/your-slug. Share on WhatsApp status, Instagram bio, or anywhere.</li>
            <li><strong>Get orders</strong> — Customers browse your catalog, add to cart, and are redirected to WhatsApp/Instagram to complete the purchase.</li>
          </ol>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "2.5rem", marginBottom: "0.75rem" }}>
            Why Vendors Choose stallHq
          </h2>
          <ul style={{ color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
            <li><strong>Zero hosting cost</strong> — No servers to manage, no hosting fees.</li>
            <li><strong>Mobile-first</strong> — Designed for African smartphones, works on any browser.</li>
            <li><strong>WhatsApp/Instagram native</strong> — Orders go directly to your existing channels.</li>
            <li><strong>No transaction fees</strong> — Payments happen between you and your customer.</li>
            <li><strong>AI-powered descriptions</strong> — Generate professional product descriptions in seconds.</li>
            <li><strong>SEO & AEO ready</strong> — Structured data makes your products findable by AI search engines.</li>
            <li><strong>GEO optimized</strong> — Geographic metadata helps local customers find your store.</li>
          </ul>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "2.5rem", marginBottom: "0.75rem" }}>
            Pricing
          </h2>
          <ul style={{ color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
            <li><strong>Free Trial</strong> — 5 days, 10 products, all core features.</li>
            <li><strong>Monthly</strong> — ₦3,500/month, up to 20 products.</li>
            <li><strong>Quarterly</strong> — ₦7,500/quarter (₦2,500/month), up to 50 products.</li>
            <li><strong>6-Month</strong> — ₦12,000 (₦2,000/month), unlimited products.</li>
          </ul>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "2.5rem", marginBottom: "0.75rem" }}>
            Frequently Asked Questions
          </h2>
          {ABOUT_FAQS.map((faq, i) => (
            <div key={i} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem" }}>{faq.question}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{faq.answer}</p>
            </div>
          ))}

          <div style={{ marginTop: "3rem", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Ready to start selling? <a href="/auth/signup" style={{ color: "var(--glow-purple)", textDecoration: "none", fontWeight: 600 }}>Create your free store →</a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
