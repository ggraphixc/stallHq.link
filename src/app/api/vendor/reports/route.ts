import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/vendor/reports — Resolved reports archive for the vendor's store.
 * Returns product_reports and review_reports that have been resolved, plus pending counts.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find the vendor's store
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all"; // all | resolved | pending

    // Fetch product reports for this store
    let productQuery = supabaseAdmin
      .from("product_reports")
      .select("*, products(name, image_url)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status === "resolved") {
      productQuery = productQuery.eq("status", "resolved");
    } else if (status === "pending") {
      productQuery = productQuery.eq("status", "pending");
    }

    // Fetch review reports for this store
    let reviewQuery = supabaseAdmin
      .from("review_reports")
      .select("*, reviews(reviewer_name, rating, comment)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status === "resolved") {
      reviewQuery = reviewQuery.eq("status", "resolved");
    } else if (status === "pending") {
      reviewQuery = reviewQuery.eq("status", "pending");
    }

    const [productResult, reviewResult] = await Promise.all([productQuery, reviewQuery]);

    const productReports = (productResult.data || []).map(r => ({
      ...r,
      type: "product" as const,
      product_name: r.products?.name || "Unknown product",
      product_image: r.products?.image_url || null,
    }));

    const reviewReports = (reviewResult.data || []).map(r => ({
      ...r,
      type: "review" as const,
      reviewer_name: r.reviews?.reviewer_name || "Anonymous",
      review_rating: r.reviews?.rating || 0,
      review_comment: r.reviews?.comment || "",
    }));

    // Combine and sort by created_at
    const allReports = [...productReports, ...reviewReports]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Counts
    const pendingProductCount = productReports.filter(r => r.status === "pending").length;
    const resolvedProductCount = productReports.filter(r => r.status === "resolved").length;
    const pendingReviewCount = reviewReports.filter(r => r.status === "pending").length;
    const resolvedReviewCount = reviewReports.filter(r => r.status === "resolved").length;

    return NextResponse.json({
      reports: allReports,
      counts: {
        pending: pendingProductCount + pendingReviewCount,
        resolved: resolvedProductCount + resolvedReviewCount,
        productPending: pendingProductCount,
        productResolved: resolvedProductCount,
        reviewPending: pendingReviewCount,
        reviewResolved: resolvedReviewCount,
      },
    });
  } catch (error) {
    console.error("Vendor reports error:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
