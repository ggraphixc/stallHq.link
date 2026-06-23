import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await supabase.auth.signOut();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
  return NextResponse.redirect(appUrl);
}
