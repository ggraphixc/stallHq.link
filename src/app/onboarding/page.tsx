import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user already has a completed store
  const { data: store } = await supabase
    .from("stores")
    .select("id, setup_complete")
    .eq("user_id", user.id)
    .single();

  if (store?.setup_complete) {
    redirect("/dashboard");
  }

  return <OnboardingWizard existingStore={store} />;
}
