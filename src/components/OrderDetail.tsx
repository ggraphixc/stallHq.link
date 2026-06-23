"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package, Clock, CheckCircle, Truck, XCircle, MessageCircle,
  ShoppingCart, ArrowLeft, Copy, Check, Store, Phone, Mail, StickyNote
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { generateFollowUpUrl } from "@/lib/whatsapp";
import { Order, Store as StoreType } from "@/types";

interface OrderDetailProps {
  order: Order;
  store: { name: string; slug: string; whatsapp_number?: string; email?: string } | null;
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Received", icon: Clock, description: "Your order has been recorded" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, description: "Vendor has confirmed your order" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: Package, description: "Order has been delivered" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  shipped: "#a855f7",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

const STATUS_BG: Record<string, string> = {
  pending: "rgba(234,179,8,0.1)",
  confirmed: "rgba(59,130,246,0.1)",
  shipped: "rgba(168,133,247,0.1)",
  delivered: "rgba(34,197,94,0.1)",
  cancelled: "rgba(239,68,68,0.1)",
};

export function OrderDetail({ order, store }: OrderDetailProps) {
  const [copied, setCopied] = useState(false);
  const { addItem, clearCart } = useCart();
  const shortId = order.id.slice(0, 8).toUpperCase();

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isDelivered = order.status === "delivered";

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReorder = () => {
    clearCart();
    order.items.forEach((item) => {
      const product = {
        id: item.product_id,
        name: item.product_name,
        price: item.price,
        image_url: null,
        store_id: order.store_id,
        description: null,
        category: null,
        in_stock: true,
        featured: false,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };
      const variant = item.variant_id ? {
        id: item.variant_id,
        product_id: item.product_id,
        option_name: item.variant_name?.split(":")[0]?.trim() || "",
        option_value: item.variant_name?.split(":")[1]?.trim() || "",
        price: item.price,
        stock_quantity: 0,
        sku: null,
        created_at: order.created_at,
      } : undefined;
      addItem(product as any, variant as any, item.quantity);
    });
    window.location.href = `/${store?.slug || ""}`;
  };

  const handleWhatsAppFollowUp = () => {
    if (!store?.whatsapp_number) return;
    const url = generateFollowUpUrl(
      store.whatsapp_number,
      store.name,
      order.id,
      order.items,
      order.total
    );
    window.open(url, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.75rem" }}>S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>StallHq</span>
          </Link>
          <Link href="/account" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <ArrowLeft size={14} /> My Orders
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Order ID + Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <h1 style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)", fontWeight: 800 }}>Order #{shortId}</h1>
              <button onClick={copyOrderId} style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "rgba(168,133,247,0.1)", color: "var(--glow-purple)", cursor: "pointer", transition: "all 0.2s" }} title="Copy order ID">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {new Date(order.created_at).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: 999, background: STATUS_BG[order.status], color: STATUS_COLORS[order.status], fontSize: "0.8125rem", fontWeight: 600 }}>
            {isCancelled ? <XCircle size={14} /> : currentStepIndex >= 0 ? STATUS_STEPS[Math.min(currentStepIndex, STATUS_STEPS.length - 1)].icon({ size: 14 }) : <Clock size={14} />}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Tracking Timeline */}
        {!isCancelled && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Truck size={16} style={{ color: "var(--glow-purple)" }} /> Order Tracking
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STATUS_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStepIndex > index || isDelivered;
                const isCurrent = currentStepIndex === index;
                const isFuture = currentStepIndex < index && !isDelivered;
                const color = isCompleted ? "var(--glow-green)" : isCurrent ? STATUS_COLORS[step.key] : "var(--text-muted)";
                const bg = isCompleted ? "rgba(16,185,129,0.1)" : isCurrent ? STATUS_BG[step.key] : "rgba(255,255,255,0.02)";

                return (
                  <div key={step.key} style={{ display: "flex", gap: "0.75rem" }}>
                    {/* Icon + line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "2rem" }}>
                      <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: bg, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                        <StepIcon size={12} style={{ color }} />
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div style={{ width: "2px", flex: 1, minHeight: "1.5rem", background: isCompleted ? "var(--glow-green)" : "var(--border-subtle)", marginTop: "0.25rem" }} />
                      )}
                    </div>
                    {/* Text */}
                    <div style={{ paddingBottom: index < STATUS_STEPS.length - 1 ? "1rem" : 0, flex: 1 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: isCurrent ? 600 : 500, color: isFuture ? "var(--text-muted)" : "var(--text-primary)" }}>
                        {step.label}
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <XCircle size={20} style={{ color: "var(--glow-red)" }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--glow-red)" }}>Order Cancelled</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>This order has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Vendor Notes */}
        {order.vendor_notes && (
          <div style={{ background: "rgba(168,133,247,0.05)", border: "1px solid rgba(168,133,247,0.15)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <StickyNote size={16} style={{ color: "var(--glow-purple)", marginTop: "0.125rem", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--glow-purple)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Vendor Update</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{order.vendor_notes}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShoppingCart size={16} style={{ color: "var(--glow-cyan)" }} /> Order Items
            </h2>
          </div>
          <div style={{ padding: "0.75rem 1.25rem" }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0", borderBottom: i < order.items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.product_name}</p>
                  {item.variant_name && <p style={{ fontSize: "0.6875rem", color: "var(--glow-purple)" }}>{item.variant_name}</p>}
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Qty: {item.quantity} &times; ₦{item.price.toLocaleString()}</p>
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--glow-green)", flexShrink: 0 }}>
                  ₦{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", marginTop: "0.5rem", paddingTop: "0.75rem" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--glow-green)" }}>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer + Store Info */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Customer */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
            <h3 style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Customer</h3>
            {order.customer_name && <p style={{ fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>{order.customer_name}</p>}
            {order.customer_phone && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}>
                <Phone size={12} /> {order.customer_phone}
              </p>
            )}
            {order.customer_email && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Mail size={12} /> {order.customer_email}
              </p>
            )}
            {!order.customer_name && !order.customer_phone && !order.customer_email && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Anonymous order</p>
            )}
          </div>

          {/* Store */}
          {store && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
              <h3 style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Store</h3>
              <Link href={`/${store.slug}`} style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--glow-purple)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
                <Store size={14} /> {store.name}
              </Link>
              {store.whatsapp_number && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Phone size={12} /> {store.whatsapp_number}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Customer Notes */}
        {order.notes && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Your Notes</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {store?.whatsapp_number && (
            <button onClick={handleWhatsAppFollowUp} className="glow-button whatsapp-button" style={{ flex: "1 1 200px", padding: "0.75rem 1.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <MessageCircle size={18} /> Chat on WhatsApp
            </button>
          )}
          <button onClick={handleReorder} style={{ flex: "1 1 200px", padding: "0.75rem 1.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)", borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer", fontWeight: 600, transition: "all 0.2s", minHeight: "44px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.1)"; }}
          >
            <ShoppingCart size={18} /> Reorder
          </button>
        </div>
      </main>
    </div>
  );
}
