import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewsClient from "./ReviewsClient";

export default async function DashboardReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let store = null;
  let reviews: any[] = [];

  try {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!storeData || !storeData.setup_complete) {
      redirect("/onboarding");
    }

    store = storeData;

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*, products(id, name, image_url)")
      .eq("store_id", storeData.id)
      .order("created_at", { ascending: false })
      .limit(300);

    reviews = reviewsData || [];
  } catch {
    redirect("/onboarding");
  }

  return <ReviewsClient store={store} reviews={reviews} />;
}
