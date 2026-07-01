import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

export async function POST() {
  try {
    // Guard: only admins may refresh tokens (this endpoint exchanges a secret).
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check for required config WITHOUT revealing which secrets are missing to
    // an unauthenticated caller. By this point the caller is a verified admin,
    // so detailed errors are acceptable below.
    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!currentToken || !appId || !appSecret) {
      return NextResponse.json(
        { error: "Instagram/Facebook credentials are not fully configured in environment variables." },
        { status: 500 }
      );
    }

    // Exchange short-lived token for long-lived token (valid ~60 days)
    const response = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
    );

    const data = await response.json();

    if (data.access_token) {
      return NextResponse.json({
        success: true,
        accessToken: data.access_token,
        expiresIn: data.expires_in, // ~5184000 seconds = 60 days
        message: `Token refreshed successfully. Valid for ${Math.floor(data.expires_in / 86400)} days.`,
      });
    }

    return NextResponse.json(
      { error: data.error?.message || "Failed to refresh token" },
      { status: 500 }
    );
  } catch {
    // Don't leak raw exception strings — they can expose internals.
    return NextResponse.json({ error: "Failed to refresh Instagram token" }, { status: 500 });
  }
}
