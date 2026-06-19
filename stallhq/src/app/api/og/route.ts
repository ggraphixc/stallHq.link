import { NextRequest } from "next/server";
import { getStoreBySlug } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug parameter", { status: 400 });
  }

  try {
    const store = await getStoreBySlug(slug);

    const storeName = store.name || "StallHq Store";
    const description = store.description || `Shop from ${storeName} on StallHq`;
    const category = store.category || "";
    const accentColor = store.theme?.primaryColor || "#a855f7";
    const bgColor = store.theme?.backgroundColor || "#0a0a0f";
    const cardBg = store.theme?.cardBackground || "#16161f";

    // Generate SVG
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="${bgColor}" />
        
        <!-- Ambient glow -->
        <ellipse cx="600" cy="200" rx="400" ry="200" fill="url(#glow)" />
        
        <!-- Card -->
        <rect x="100" y="150" width="1000" height="330" rx="24" fill="${cardBg}" stroke="${accentColor}" stroke-opacity="0.2" stroke-width="1" />
        
        <!-- Logo circle -->
        <circle cx="200" cy="280" r="50" fill="${accentColor}" fill-opacity="0.2" />
        <text x="200" y="295" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${accentColor}" text-anchor="middle">${storeName.charAt(0).toUpperCase()}</text>
        
        <!-- Store name -->
        <text x="280" y="270" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#f8fafc">${escapeXml(storeName.substring(0, 30))}</text>
        
        <!-- Description -->
        <text x="280" y="320" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">${escapeXml(description.substring(0, 60))}</text>
        
        <!-- Category badge -->
        ${category ? `
          <rect x="280" y="350" width="${category.length * 12 + 24}" height="32" rx="16" fill="${accentColor}" fill-opacity="0.2" />
          <text x="292" y="372" font-family="Arial, sans-serif" font-size="14" fill="${accentColor}">${escapeXml(category)}</text>
        ` : ""}
        
        <!-- Footer -->
        <text x="600" y="500" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">Powered by stallHq</text>
        
        <!-- StallHq branding -->
        <rect x="1020" y="480" width="60" height="60" rx="12" fill="${accentColor}" fill-opacity="0.2" />
        <text x="1050" y="518" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${accentColor}" text-anchor="middle">S</text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    // Return a default SVG for missing stores
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#0a0a0f" />
        <text x="600" y="300" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#f8fafc" text-anchor="middle">StallHq</text>
        <text x="600" y="350" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">Digital Storefronts</text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
