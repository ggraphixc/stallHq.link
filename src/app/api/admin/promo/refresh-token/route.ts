import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  try {
    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!currentToken) {
      return NextResponse.json({ error: "INSTAGRAM_ACCESS_TOKEN not set in environment variables" }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "Facebook app credentials not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to environment variables." },
        { status: 500 }
      );
    }

    // Exchange short-lived token for long-lived token (valid ~60 days)
    const response = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
