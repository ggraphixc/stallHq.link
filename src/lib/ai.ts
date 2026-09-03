import { NextRequest } from "next/server";
import { createClient as createServiceClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared AI provider helpers — used by /api/ai/generate-description,
 * /api/ai/bulk-descriptions, and /api/ai/assistant.
 *
 * The AI provider (OpenRouter / OpenAI / custom), model and API key are all
 * configured by the platform admin in Admin → Settings → AI and stored in
 * platform_settings. Nothing is hardcoded here.
 */

export const PROVIDER_URLS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  opencodezen: "",
  openai: "https://api.openai.com/v1/chat/completions",
  custom: "",
};

export interface AiProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 min

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export function getRateLimitReset(userId: string): number | null {
  const entry = rateLimitMap.get(userId);
  if (!entry) return null;
  const now = Date.now();
  if (now > entry.resetAt) return null;
  return Math.ceil((entry.resetAt - now) / 1000);
}

export function adminClient(): SupabaseClient {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Load AI settings from platform_settings */
export async function getAiSettings(): Promise<Record<string, any>> {
  const { data } = await adminClient()
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "ai_enabled",
      "ai_provider",
      "ai_model",
      "ai_api_key",
      "ai_base_url",
      "ai_assistant_enabled",
    ]);
  const settings: Record<string, any> = {};
  data?.forEach((r) => { settings[r.key] = r.value; });
  return settings;
}

/** Resolve a usable provider config from settings (throws descriptive errors) */
export function resolveProvider(settings: Record<string, any>): AiProviderConfig {
  const enabled = settings.ai_enabled === true || settings.ai_enabled === "true";
  if (!enabled) {
    throw new Error("AI_FEATURES_DISABLED");
  }
  const apiKey = settings.ai_api_key;
  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED_KEY");
  }
  const model = settings.ai_model;
  if (!model) {
    throw new Error("AI_NOT_CONFIGURED_MODEL");
  }

  const provider = settings.ai_provider || "openrouter";
  let baseUrl = settings.ai_base_url || PROVIDER_URLS[provider] || "";
  if (!baseUrl) {
    throw new Error("AI_NO_BASE_URL");
  }
  if (!baseUrl.endsWith("/chat/completions")) {
    baseUrl = baseUrl.replace(/\/+$/, "") + "/chat/completions";
  }

  return { provider, model, apiKey, baseUrl };
}

/** Fetch with timeout */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function providerError(status: number): { message: string; status: number } {
  switch (status) {
    case 429: return { message: "AI provider rate limit hit. Try again in a minute.", status: 429 };
    case 401:
    case 403: return { message: "Invalid AI API key. Check your settings.", status: 401 };
    case 404: return { message: "AI model not found. Check your settings.", status: 404 };
    default: return { message: "AI provider error. Try again later.", status: 502 };
  }
}

/**
 * Call the configured chat-completions provider. Returns the text content,
 * throws Error with descriptive message on failure.
 */
export async function callAiProvider(
  config: AiProviderConfig,
  messages: Array<{ role: string; content: any }>,
  maxTokens = 700
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
    headers["X-Title"] = "stallHq";
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(config.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: config.model, messages, max_tokens: maxTokens }),
    }, 30000);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("AI request timed out. The service may be slow — try again.");
    }
    throw new Error("Could not connect to AI provider. Check your network.");
  }

  if (!response.ok) {
    const { message, status } = providerError(response.status);
    console.error("AI provider error:", response.status, (await response.text().catch(() => "")).slice(0, 200));
    throw Object.assign(new Error(message), { status });
  }

  const data = await response.json();
  let content =
    data.choices?.[0]?.message?.content?.trim() ??
    data.choices?.[0]?.text?.trim() ??
    data.output?.text?.trim();
  if (!content) {
    console.error("AI empty response:", JSON.stringify(data).slice(0, 1000));
    throw new Error("AI returned an empty response. Try again.");
  }
  return content;
}

/**
 * Build a grounded catalog listing used by the store AI assistant so the
 * model can only answer from real inventory.
 */
export function buildCatalogPrompt(products: Array<{ name: string; price: number; category?: string | null; description?: string | null; in_stock?: boolean }>): string {
  if (!products.length) return "(The store has no products listed yet.)";
  const lines = products.map((p) => {
    const parts = [`- ${p.name}`];
    if (p.category) parts.push(`[${p.category}]`);
    parts.push(`₦${Number(p.price).toLocaleString()}`);
    if (p.description && p.description.trim()) parts.push(`— ${p.description.slice(0, 140)}`);
    if (p.in_stock === false) parts.push("(OUT OF STOCK)");
    return parts.join(" ");
  });
  return lines.join("\n");
}
