import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Hybrid rate limiter
//
// 1. If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, use
//    Upstash Redis via @upstash/ratelimit (global, cross-instance).
// 2. If Upstash is unreachable or not configured, fall back to an in-memory
//    sliding-window Map (per-instance only — fine for low-to-medium traffic).
//
// Both paths expose the same exported API surface so callers never change.
// ---------------------------------------------------------------------------

// ─── Upstash (lazy init) ─────────────────────────────────────────────────────

let upstashLimiter: null | ((key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }>) = null;
let upstashChecked = false;

async function getUpstashLimiter() {
  if (upstashChecked) return upstashLimiter;
  upstashChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Dynamic import so the app still works without the packages installed
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);

    const redis = new Redis({ url, token });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"), // default; overridden per-route
      analytics: false,
      prefix: "stallhq:ratelimit",
    });

    upstashLimiter = async (key: string) => {
      const result = await ratelimit.limit(key);
      return { success: result.success, limit: result.limit, remaining: result.remaining, reset: result.reset };
    };

    console.log("[RateLimit] Upstash Redis connected");
    return upstashLimiter;
  } catch (e) {
    console.warn("[RateLimit] Upstash unavailable, using in-memory fallback:", e);
    upstashLimiter = null;
    return null;
  }
}

// ─── In-memory sliding window ────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

const memStore = new Map<string, WindowEntry>();

// Cleanup stale entries every 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
      if (entry.timestamps.length === 0) memStore.delete(key);
    }
  }, 60_000);
}

function memSlidingWindow(
  key: string,
  windowSec: number,
  maxReqs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;

  let entry = memStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memStore.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const count = entry.timestamps.length;
  const limit = maxReqs;
  const remaining = Math.max(0, limit - count);
  const reset =
    entry.timestamps.length > 0
      ? entry.timestamps[0] + windowMs
      : now + windowMs;

  if (count >= limit) {
    return { success: false, limit, remaining: 0, reset };
  }

  entry.timestamps.push(now);
  return { success: true, limit, remaining: remaining - 1, reset };
}

// ─── Unified check ───────────────────────────────────────────────────────────

async function checkBoth(
  key: string,
  windowSec: number,
  maxReqs: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const upstash = await getUpstashLimiter();
  if (upstash) {
    try {
      return await upstash(key);
    } catch (e) {
      console.warn("[RateLimit] Upshot call failed, falling back to memory:", e);
    }
  }
  return memSlidingWindow(key, windowSec, maxReqs);
}

// ─── Pre-configured limiters ─────────────────────────────────────────────────

function createLimiter(windowSec: number, maxReqs: number) {
  return { windowSec, maxReqs };
}

export const apiLimiter = createLimiter(60, 60); // 60 req / min
export const strictLimiter = createLimiter(60, 10); // 10 req / min
export const authLimiter = createLimiter(60, 8); // 8 req / min
export const orderLimiter = createLimiter(60, 10); // 10 req / min

// ─── Public API ──────────────────────────────────────────────────────────────

interface RateLimitResult {
  success: boolean;
  response?: NextResponse;
  headers?: Record<string, string>;
}

export async function checkRateLimit(
  limiter: { windowSec: number; maxReqs: number } | null,
  key: string
): Promise<RateLimitResult> {
  if (!limiter) return { success: true };

  const { success, limit, remaining, reset } = await checkBoth(
    key,
    limiter.windowSec,
    limiter.maxReqs
  );

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  };

  if (!success) {
    const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return {
      success: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter },
        {
          status: 429,
          headers: { ...headers, "Retry-After": retryAfter.toString() },
        }
      ),
      headers,
    };
  }

  return { success: true, headers };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function wrapLimiter(limiter: { windowSec: number; maxReqs: number } | null) {
  return async (request: Request) => {
    const ip = getClientIp(request);
    return checkRateLimit(limiter, ip);
  };
}

export const apiRateLimit = wrapLimiter(apiLimiter);
export const authRateLimit = wrapLimiter(authLimiter);
export const orderRateLimit = wrapLimiter(orderLimiter);

export function addRateLimitHeaders(
  response: NextResponse,
  headers?: Record<string, string>
): NextResponse {
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }
  return response;
}
