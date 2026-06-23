import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";
  return NextResponse.redirect(appUrl);
}
