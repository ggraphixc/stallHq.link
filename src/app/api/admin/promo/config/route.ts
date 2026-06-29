import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

// GET /api/admin/promo/config — platform connection status + database stats
export async function GET() {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check platform connection status
    const whatsappConfigured = !!(
      process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
    );
    const instagramConfigured = !!process.env.INSTAGRAM_ACCESS_TOKEN;

    // Get database stats
    const [promoPostsResult, scheduledPostsResult] = await Promise.allSettled([
      supabaseAdmin.from("promo_posts").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("scheduled_promo_posts").select("id", { count: "exact", head: true }),
    ]);

    const promo_posts =
      promoPostsResult.status === "fulfilled" ? promoPostsResult.value.count || 0 : 0;
    const scheduled_posts =
      scheduledPostsResult.status === "fulfilled" ? scheduledPostsResult.value.count || 0 : 0;

    return NextResponse.json({
      platformStatus: {
        whatsapp: {
          configured: whatsappConfigured,
          phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
        },
        instagram: {
          configured: instagramConfigured,
        },
      },
      stats: {
        promo_posts,
        scheduled_posts,
      },
    });
  } catch (error) {
    console.error("Error fetching promo config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
