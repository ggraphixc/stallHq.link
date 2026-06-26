"use client";

import { useEffect } from "react";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateFAQSchema,
  generateHowToSchema,
} from "@/lib/seo";

const HOME_FAQS = [
  {
    question: "What is stallHq?",
    answer:
      "stallHq is a free digital storefront platform for WhatsApp and Instagram vendors in Nigeria and Africa. You get a professional online store with a custom URL, product catalog, and one-click ordering — all at zero hosting cost.",
  },
  {
    question: "How much does stallHq cost?",
    answer:
      "stallHq is free to start with a 5-day trial. After that, plans start from ₦3,500/month. There are no transaction fees — all payments happen directly between you and your customer via WhatsApp or Instagram.",
  },
  {
    question: "Do I need coding skills to create a store?",
    answer:
      "No. stallHq is designed for vendors with zero technical skills. Sign up, add your products, and your store is live in under 60 seconds.",
  },
  {
    question: "How do customers pay?",
    answer:
      "stallHq doesn't handle payments. When a customer places an order, they're directed to WhatsApp or Instagram where you complete the transaction directly. This keeps things simple and trust-based.",
  },
  {
    question: "Can I use stallHq on my phone?",
    answer:
      "Yes. stallHq is mobile-first and works on any smartphone browser. No app download needed. It also works as a PWA — you can add it to your home screen.",
  },
  {
    question: "What is AEO (Answer Engine Optimization)?",
    answer:
      "AEO is the practice of structuring your store and product data so that AI search engines like ChatGPT, Perplexity, and Google AI can accurately describe your products to potential customers. stallHq automatically adds the right structured data to make your store AEO-ready.",
  },
];

const HOW_TO_STEPS = [
  {
    name: "Sign up for free",
    text: "Create your stallHq account in seconds. No credit card required.",
  },
  {
    name: "Add your store details",
    text: "Enter your store name, description, and connect your WhatsApp or Instagram.",
  },
  {
    name: "Add your products",
    text: "Upload product photos, set prices, and write descriptions. Use AI to generate descriptions instantly.",
  },
  {
    name: "Share your store link",
    text: "Your store is live at hqlink.vercel.app/your-slug. Share it on WhatsApp status, Instagram bio, or anywhere.",
  },
  {
    name: "Receive orders",
    text: "Customers browse your catalog and place orders. You get notified instantly and complete the sale on WhatsApp or Instagram.",
  },
];

export function HomeStructuredData() {
  useEffect(() => {
    const orgSchema = generateOrganizationSchema();
    const siteSchema = generateWebSiteSchema();
    const faqSchema = generateFAQSchema(HOME_FAQS);
    const howToSchema = generateHowToSchema(
      "How to Create a Free Online Store with stallHq",
      "Set up your digital storefront in minutes. Sell on WhatsApp and Instagram with zero hosting cost.",
      HOW_TO_STEPS
    );

    const schemas = [orgSchema, siteSchema, faqSchema, howToSchema];

    // Remove old schemas if any
    document.querySelectorAll("[data-seo-home]").forEach((el) => el.remove());

    schemas.forEach((schema, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-home", "");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll("[data-seo-home]").forEach((el) => el.remove());
    };
  }, []);

  return null;
}
