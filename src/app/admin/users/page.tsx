import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminUsers } from "./AdminUsers";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map(s => s.trim()).filter(Boolean);
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(user.id)) redirect("/dashboard");

  return <AdminUsers />;
}
