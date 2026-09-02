import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Login] Missing env vars:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const rl = await authRateLimit(req);
    if (!rl.success) return rl.response!;

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    let cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(setCookies, _headers) {
          cookiesToSet = setCookies;
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Login] signInWithPassword error:", error.message);
      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json({ error: "email_not_confirmed" }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      console.error("[Login] No session returned after successful sign-in");
      return NextResponse.json({ error: "No session" }, { status: 500 });
    }

    // Return JSON success — cookies are set on this response
    // Client will navigate to /dashboard after receiving this
    const response = addRateLimitHeaders(
      NextResponse.json({ success: true }),
      rl.headers
    );

    for (const cookie of cookiesToSet) {
      response.cookies.set(cookie.name, cookie.value, cookie.options as any);
    }

    return response;
  } catch (e) {
    console.error("[Login] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
