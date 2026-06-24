import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/api";
import { OrderDetail } from "@/components/OrderDetail";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const shortId = id.slice(0, 8).toUpperCase();
  return {
    title: `Order #${shortId}`,
    description: `View your order #${shortId} details and tracking status`,
  };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, stores(name, slug, whatsapp_number, instagram_handle, email)")
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const store = Array.isArray(order.stores) ? order.stores[0] : order.stores;

  return <OrderDetail order={order} store={store || null} />;
}
