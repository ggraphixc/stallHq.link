import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options;

  return async function rateLimitMiddleware(
    request: Request
  ): Promise<{ success: boolean; response?: NextResponse; headers?: Record<string, string> }> {
    // Generate key from IP or custom generator
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] || "unknown";
    const key = keyGenerator ? keyGenerator(request) : ip;

    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        success: true,
        headers: {
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": (maxRequests - 1).toString(),
          "X-RateLimit-Reset": Math.ceil((now + windowMs) / 1000).toString(),
        },
      };
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
            retryAfter,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(entry.resetTime / 1000).toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        ),
      };
    }

    // Increment counter
    entry.count++;

    return {
      success: true,
      headers: {
        "X-RateLimit-Limit": maxRequests.toString(),
        "X-RateLimit-Remaining": (maxRequests - entry.count).toString(),
        "X-RateLimit-Reset": Math.ceil(entry.resetTime / 1000).toString(),
      },
    };
  };
}

// Pre-configured rate limiters
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
});

// Auth endpoints — tighter to blunt brute-force / email-bombing.
// NOTE: in-memory, so per-instance on Vercel serverless; still raises the bar
// and protects single-instance (dev/preview) deployments.
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 8,
});

// Helper to add rate limit headers to response
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
