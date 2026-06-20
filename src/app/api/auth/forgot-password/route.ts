import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
    }

    const user = users.users.find((u) => u.email === email);
    if (!user) {
      // Don't reveal whether a user exists
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unused reset tokens for this user
    await supabase
      .from("password_resets")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store the token
    const { error: insertError } = await supabase.from("password_resets").insert({
      user_id: user.id,
      email,
      token,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Failed to store reset token:", insertError);
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
    }

    // Send the reset email
    const name = user.user_metadata?.name || user.user_metadata?.full_name;
    await sendPasswordResetEmail({ email, token, name });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
