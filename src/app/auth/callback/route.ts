import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If a specific next URL was provided, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check if user has a store to determine redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: store } = await supabase
          .from("stores")
          .select("id, setup_complete")
          .eq("user_id", user.id)
          .single();

        if (!store) {
          // New user - redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        if (!store.setup_complete) {
          // User has store but hasn't completed setup
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // Existing user with complete setup - go to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
