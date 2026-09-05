import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorReportsClient } from "./VendorReportsClient";

export default async function VendorReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!store) redirect("/onboarding");

  return <VendorReportsClient store={store} />;
}
