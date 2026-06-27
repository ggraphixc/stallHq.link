import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/api";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST() {
  try {
    const authSupabase = await createAuthClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Send welcome email (non-blocking, fire-and-forget)
    sendWelcomeEmail({
      email: user.email!,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
