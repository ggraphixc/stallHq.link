import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionsClient } from "./SubscriptionsClient";

// Admin user IDs — only these users can access subscription management
const ADMIN_USER_IDS = [
  process.env.ADMIN_USER_ID,
  // Add more admin IDs here as needed
].filter(Boolean);

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Only admin users can access this page
  if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(user.id)) {
    redirect("/dashboard");
  }

  // Fetch all stores with subscription data
  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch payment history
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <SubscriptionsClient
      stores={stores || []}
      payments={payments || []}
      currentUserId={user.id}
    />
  );
}
