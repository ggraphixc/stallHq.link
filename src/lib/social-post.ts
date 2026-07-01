import { createClient } from "@supabase/supabase-js";

/**
 * Shared social-post utilities for WhatsApp Business + Instagram Graph APIs.
 *
 * Used by: /api/promo/auto-post, /api/promo/scheduled/post-now, /api/cron/marketing
 * Keeps ONE copy of the posting logic (previously triplicated & inconsistent).
 */

export const GRAPH_API_VERSION = "v23.0";

export interface SocialStore {
  id: string;
  name: string;
  slug: string;
  whatsapp_number?: string | null;
  instagram_handle?: string | null;
}

export interface SocialProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
}

export interface PostResult {
  success: boolean;
  messageId?: string;
  /** Human-readable error shown directly to the user */
  error?: string;
  /** Raw API error for logging */
  rawError?: string;
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function buildCaption(product: SocialProduct, store: SocialStore): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stallhq.com";
  const shareUrl = `${appUrl}/${store.slug}/product/${product.id}`;
  const price = `₦${product.price.toLocaleString()}`;

  return [
    `🔥 *${product.name}*`,
    ``,
    `💰 Price: *${price}*`,
    `🏪 Store: *${store.name}*`,
    ``,
    `✅ Available now!`,
    `📞 Order direct or click link below 👇`,
    ``,
    `${shareUrl}`,
    ``,
    `_Powered by StallHq_`,
  ].join("\n");
}

// ─── Instagram ───────────────────────────────────────────────────────────────

const igUserIdCache = new Map<string, string>();

/**
 * Discover the Instagram Business Account ID for the currently tokenised user.
 *
 * The INSTAGRAM_ACCESS_TOKEN we hold is a long-lived *Facebook User* token.
 * Publishing requires POSTing to `/{ig_user_id}/media` — NOT `/me/media`
 * (which maps to the FB user and returns "Unsupported post request").
 *
 * Flow: /me/accounts → pages → page.fields(instagram_business_account) → ig_user_id
 */
export async function resolveInstagramUserId(token: string): Promise<string | null> {
  if (igUserIdCache.has(token)) return igUserIdCache.get(token)!;

  try {
    // 1. Pages the user can manage
    const accountsRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?access_token=${token}&fields=id,instagram_business_account,access_token`
    );
    const accounts = await accountsRes.json();

    const pages = Array.isArray(accounts?.data) ? accounts.data : [];
    for (const page of pages) {
      const igAcct = page.instagram_business_account;
      if (igAcct?.id) {
        igUserIdCache.set(token, igAcct.id);
        return igAcct.id as string;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Publish an image to Instagram.
 * Two-step Graph API flow: create container, then publish.
 */
export async function postToInstagram(args: {
  token: string;
  imageUrl?: string | null;
  caption: string;
}): Promise<PostResult> {
  const { token, imageUrl, caption } = args;

  if (!token) {
    return { success: false, error: "Instagram Graph API not configured — set INSTAGRAM_ACCESS_TOKEN" };
  }

  if (!imageUrl) {
    return { success: false, error: "Instagram requires a product image to post. Add an image to this product." };
  }

  const igUserId = await resolveInstagramUserId(token);
  if (!igUserId) {
    return {
      success: false,
      error: "No Instagram Business Account found on this Facebook account. Convert the IG account to a Business profile and link it to a Facebook Page.",
    };
  }

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, caption }),
      }
    );
    const container = await containerRes.json();

    if (!container.id) {
      const msg = container.error?.message || "Failed to create IG media container";
      return {
        success: false,
        error: userFriendlyIgError(msg, imageUrl),
        rawError: JSON.stringify(container.error || container),
      };
    }

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: container.id }),
      }
    );
    const published = await publishRes.json();

    if (published.id) {
      return { success: true, messageId: published.id };
    }

    const msg = published.error?.message || "Failed to publish to Instagram";
    return {
      success: false,
      error: userFriendlyIgError(msg, imageUrl),
      rawError: JSON.stringify(published.error || published),
    };
  } catch (error) {
    return { success: false, error: "Network error contacting Instagram", rawError: String(error) };
  }
}

function userFriendlyIgError(msg: string, imageUrl?: string | null): string {
  const lower = msg.toLowerCase();
  if (lower.includes("unsupported post request")) {
    return "Instagram rejected the request — ensure the linked account is a Business/Creator profile connected to a Facebook Page.";
  }
  if (lower.includes("invalid") && lower.includes("image")) {
    return `Instagram could not fetch the product image. The image URL must be public and a JPEG/PNG: ${imageUrl}`;
  }
  if (lower.includes("permission") || lower.includes("scope") || lower.includes("access")) {
    return "Instagram token lacks the required permissions (instagram_content_publish). Re-authorize the app.";
  }
  if (lower.includes("session") || lower.includes("invalid oauth") || lower.includes("token")) {
    return "Instagram token is invalid or expired. Refresh it in Admin → Promo → Configuration.";
  }
  return `Instagram error: ${msg}`;
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────

/**
 * Send a WhatsApp message (image if available, else text) via the Cloud API.
 */
export async function postToWhatsApp(args: {
  token: string;
  phoneNumberId: string;
  toNumber: string;
  caption: string;
  imageUrl?: string | null;
}): Promise<PostResult> {
  const { token, phoneNumberId, toNumber, caption, imageUrl } = args;
  const to = toNumber.replace(/\D/g, "");

  if (!token || !phoneNumberId) {
    return { success: false, error: "WhatsApp Business API not configured — set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID" };
  }

  // Try image message first
  if (imageUrl) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "image",
            image: { link: imageUrl, caption },
          }),
        }
      );
      const data = await res.json();
      if (data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }
      // Don't hard-fail on image errors; fall back to text
      console.warn("[whatsapp] image send failed, falling back to text:", data.error?.message);
    } catch (e) {
      console.warn("[whatsapp] image send error, falling back to text:", e);
    }
  }

  // Fallback: text message
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: caption },
        }),
      }
    );
    const data = await res.json();
    if (data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    }

    const msg = data.error?.message || "Failed to send WhatsApp message";
    return {
      success: false,
      error: userFriendlyWaError(msg, to),
      rawError: JSON.stringify(data.error || data),
    };
  } catch (error) {
    return { success: false, error: "Network error contacting WhatsApp", rawError: String(error) };
  }
}

function userFriendlyWaError(msg: string, to: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("recipient phone number is not a valid whatsapp user") || lower.includes("not a whatsapp user")) {
    return `The number ${to} is not on WhatsApp or hasn't messaged the business within 24h (free-tier messaging window).`;
  }
  if (lower.includes("(#131047)") || lower.includes("window")) {
    return `Cannot message ${to} — outside the 24-hour customer-support window required by WhatsApp.`;
  }
  if (lower.includes("(#131030)") || lower.includes("recipient") ) {
    return `Recipient ${to} is invalid. Check the WhatsApp number on the store.`;
  }
  if (lower.includes("permission") || lower.includes("access token")) {
    return "WhatsApp token is invalid or lacks permission. Check WHATSAPP_ACCESS_TOKEN.";
  }
  return `WhatsApp error: ${msg}`;
}

// ─── Orchestration ───────────────────────────────────────────────────────────

export type Platform = "whatsapp" | "instagram" | "both";

/**
 * Post to a platform using store + product data.
 * Pulls credentials from env (platform-level), so any connected store can post.
 * When platform is "both", posts to WhatsApp first, then Instagram.
 */
export async function postPromo(args: {
  platform: Platform;
  store: SocialStore;
  product: SocialProduct;
  caption?: string;
}): Promise<PostResult> {
  const { platform, store, product } = args;
  const caption = args.caption || buildCaption(product, store);

  // ── "both" → post to WhatsApp + Instagram, return composite result ──
  if (platform === "both") {
    const results: PostResult[] = [];

    // WhatsApp (non-fatal if store has no number)
    if (store.whatsapp_number) {
      results.push(
        await postToWhatsApp({
          token: process.env.WHATSAPP_ACCESS_TOKEN!,
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
          toNumber: store.whatsapp_number,
          caption,
          imageUrl: product.image_url,
        })
      );
    } else {
      results.push({ success: false, error: "No WhatsApp number on this store" });
    }

    // Instagram (non-fatal if store has no handle)
    if (store.instagram_handle) {
      results.push(
        await postToInstagram({
          token: process.env.INSTAGRAM_ACCESS_TOKEN!,
          caption,
          imageUrl: product.image_url,
        })
      );
    } else {
      results.push({ success: false, error: "No Instagram handle on this store" });
    }

    const anySuccess = results.some((r) => r.success);
    const failures = results.filter((r) => !r.success);

    return {
      success: anySuccess,
      messageId: results.find((r) => r.messageId)?.messageId,
      error: failures.length > 0
        ? failures.map((f) => f.error).join("; ")
        : undefined,
    };
  }

  // ── Single platform ──
  if (platform === "whatsapp") {
    if (!store.whatsapp_number) {
      return { success: false, error: "No WhatsApp number set on this store." };
    }
    return postToWhatsApp({
      token: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      toNumber: store.whatsapp_number,
      caption,
      imageUrl: product.image_url,
    });
  }

  // instagram
  if (!store.instagram_handle) {
    return { success: false, error: "No Instagram handle set on this store." };
  }
  return postToInstagram({
    token: process.env.INSTAGRAM_ACCESS_TOKEN!,
    caption,
    imageUrl: product.image_url,
  });
}

/**
 * Non-fatal logging to promo_posts. Never throws — a logging failure must
 * not turn a successful post into a 500.
 *
 * `extra` columns (caption, message_id, posted_at, error) are best-effort:
 * they may not exist yet on older schemas, so each insert is wrapped.
 */
export async function logPromoPost(args: {
  storeId: string;
  productId: string;
  platform: Platform;
  result: PostResult;
  caption: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  try {
    await supabase.from("promo_posts").insert({
      store_id: args.storeId,
      product_id: args.productId,
      platform: args.platform,
      status: args.result.success ? "posted" : "failed",
      message_id: args.result.messageId || null,
      error: args.result.error || null,
      caption: args.caption,
      posted_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[promo_posts] logging failed (non-fatal):", e);
  }
}
