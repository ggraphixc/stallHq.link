import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Upstash Redis client — reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
// Falls back to in-memory if env vars are missing (local dev convenience).
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function createLimiter(windowSec: number, maxReqs: number) {
  if (redis) {
    const r = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxReqs, `${windowSec}s`),
      analytics: true,
      prefix: "stallhq:ratelimit",
    });
    return r;
  }
  return null;
}

// Pre-configured limiters (sliding window, per IP)
export const apiLimiter = createLimiter(60, 60);       // 60 req / min
export const strictLimiter = createLimiter(60, 10);    // 10 req / min
export const authLimiter = createLimiter(60, 8);       // 8 req / min
export const orderLimiter = createLimiter(60, 10);     // 10 req / min

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
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitResult> {
  // No Redis configured — allow through (dev mode)
  if (!limiter) {
    return { success: true };
  }

  const { success, limit, remaining, reset } = await limiter.limit(key);

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

// Backward-compatible wrapper: returns (request) => { success, response?, headers? }
// so existing routes (apiRateLimit(request), authRateLimit(request)) work unchanged.
function wrapLimiter(limiter: Ratelimit | null) {
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
