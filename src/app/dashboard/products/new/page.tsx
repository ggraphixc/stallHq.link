import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewProductClient } from "./NewProductClient";

export default async function NewProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!store || !store.setup_complete) {
    redirect("/onboarding");
  }

  return <NewProductClient store={store} />;
}
