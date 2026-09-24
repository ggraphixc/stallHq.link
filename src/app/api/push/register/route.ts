import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/push/register — Register or update an Expo push token.
 * Called by the mobile app (with x-access-token) or web client (cookie session).
 * Upserts by token so the latest user_id is always current.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-access-token");
    let userId: string | null = null;

    if (authHeader) {
      // Mobile app sends Supabase access token directly
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader);
      if (!error && user) userId = user.id;
    } else {
      // Web client uses cookie session
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : null;
    const platform = ["ios", "android", "web"].includes(body.platform)
      ? body.platform
      : "web";

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid push token" }, { status: 400 });
    }

    // Upsert by token — if the token already exists for another user, update it
    const { error } = await supabaseAdmin
      .from("push_tokens")
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push/register] Error:", error);
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
  }
}

/**
 * DELETE /api/push/register — Remove a push token (e.g. on sign-out).
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-access-token");
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader);
      if (!error && user) userId = user.id;
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (token) {
      // Delete specific token
      await supabaseAdmin
        .from("push_tokens")
        .delete()
        .eq("token", token)
        .eq("user_id", userId);
    } else {
      // Delete all tokens for this user
      await supabaseAdmin
        .from("push_tokens")
        .delete()
        .eq("user_id", userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push/register] Delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
