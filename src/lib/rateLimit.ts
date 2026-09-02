import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter (per-function-instance).
// Works without any external dependency.  NOTE: on Vercel each function
// instance has its own memory, so this limits per-instance, not globally.
// For most low-to-medium traffic apps that's perfectly fine.
// ---------------------------------------------------------------------------

interface WindowEntry {
  /** Timestamps (ms) of requests inside the current window */
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Periodic cleanup – remove stale entries every 60 s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    // Keep only timestamps from the last 120 s (longest possible window)
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60_000);

function slidingWindowCheck(
  key: string,
  windowSec: number,
  maxReqs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the window
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

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------
function createLimiter(windowSec: number, maxReqs: number) {
  return { windowSec, maxReqs };
}

export const apiLimiter = createLimiter(60, 60); // 60 req / min
export const strictLimiter = createLimiter(60, 10); // 10 req / min
export const authLimiter = createLimiter(60, 8); // 8 req / min
export const orderLimiter = createLimiter(60, 10); // 10 req / min

interface RateLimitResult {
  success: boolean;
  response?: NextResponse;
  headers?: Record<string, string>;
}

/**
 * Check rate limit for a given key (usually IP address).
 * Returns { success: true } if allowed, or { success: false, response } with 429.
 */
export async function checkRateLimit(
  limiter: { windowSec: number; maxReqs: number } | null,
  key: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true };
  }

  const { success, limit, remaining, reset } = slidingWindowCheck(
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

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

// Backward-compatible wrapper so existing routes work unchanged.
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
