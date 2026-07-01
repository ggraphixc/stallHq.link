import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";
import { authRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rl = await authRateLimit(request);
    if (!rl.success) return rl.response!;

    const { email, code, type = "signup" } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("type", type)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Mark as used
    await supabase
      .from("email_verifications")
      .update({ used: true })
      .eq("id", verification.id);

    // Confirm the user's email in Supabase Auth
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error("Failed to confirm email:", confirmError);
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
    }

    // Send welcome email
    const { data: user } = await supabase.auth.admin.getUserById(verification.user_id);
    const name = user?.user?.user_metadata?.name || user?.user?.user_metadata?.full_name;
    await sendWelcomeEmail({ email, name });

    return addRateLimitHeaders(NextResponse.json({ success: true }), rl.headers);
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
