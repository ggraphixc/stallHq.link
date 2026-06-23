import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

function generateCode(): string {
  // Use cryptographically secure random for verification codes
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: Request) {
  try {
    const { email, type = "signup" } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find user by email — Supabase admin API has no getUserByEmail, so listUsers is the only option
    // For 10k+ users, create an RPC function: CREATE FUNCTION find_user_by_email(p_email text) ...
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listError) {
      return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
    }

    const user = users.users.find((u) => u.email === email);
    if (!user) {
      // Don't reveal whether a user exists
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unused codes for this user and type
    await supabase
      .from("email_verifications")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("used", false);

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store the code
    const { error: insertError } = await supabase.from("email_verifications").insert({
      user_id: user.id,
      email,
      code,
      type,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Failed to store verification code:", insertError);
      return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }

    // Send the email
    const name = user.user_metadata?.name || user.user_metadata?.full_name;
    const emailSent = await sendVerificationEmail({ email, code, name });
    console.log("[send-verification] Email sent:", emailSent);

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
