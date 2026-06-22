"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Package, Clock, CheckCircle, XCircle, Truck, ShoppingBag } from "lucide-react";

interface OrderItem {
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  store_id: string;
  customer_name: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  stores: { name: string; slug: string } | null;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: <Clock size={14} />, label: "Pending" },
  confirmed: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: <CheckCircle size={14} />, label: "Confirmed" },
  shipped: { color: "#a855f7", bg: "rgba(168,133,247,0.1)", icon: <Truck size={14} />, label: "Shipped" },
  delivered: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: <CheckCircle size={14} />, label: "Delivered" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: <XCircle size={14} />, label: "Cancelled" },
};

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const lookupOrders = async () => {
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setOrders(data.orders);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.75rem" }}>S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>StallHq</span>
          </Link>
          <Link href="/" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
        </div>
      </header>

      <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "3rem 1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Package size={20} style={{ color: "var(--glow-purple)" }} />
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
            My Orders
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "24rem", margin: "0 auto" }}>
            Enter the email you used when placing orders to view your order history.
          </p>
        </div>

        {/* Email lookup form */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", maxWidth: "28rem", margin: "0 auto 2rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupOrders()}
              placeholder="Enter your email"
              style={{
                width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem",
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.5rem", color: "var(--text-primary)", fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={lookupOrders}
            disabled={loading}
            className="glow-button"
            style={{ padding: "0.75rem 1.25rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.375rem", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "Searching..." : "Find Orders"}
            {!loading && <ArrowRight size={14} />}
          </button>
        </div>

        {error && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", fontSize: "0.8125rem", marginBottom: "1.5rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Orders list */}
        {searched && (
          <div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              {orders.length} {orders.length === 1 ? "order" : "orders"} found
            </p>

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <ShoppingBag size={40} style={{ margin: "0 auto 1rem", color: "var(--text-muted)", opacity: 0.3 }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>No orders found for this email.</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>Check the email you used at checkout.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <div
                      key={order.id}
                      style={{
                        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                        borderRadius: "0.75rem", overflow: "hidden",
                      }}
                    >
                      {/* Order header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--glow-purple)" }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          {order.stores && (
                            <Link href={`/${order.stores.slug}`} style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none" }}>
                              {order.stores.name}
                            </Link>
                          )}
                        </div>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                          padding: "0.25rem 0.625rem", borderRadius: 999,
                          background: status.bg, color: status.color,
                          fontSize: "0.6875rem", fontWeight: 600,
                        }}>
                          {status.icon} {status.label}
                        </span>
                      </div>

                      {/* Order items */}
                      <div style={{ padding: "0.75rem 1rem" }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0", fontSize: "0.8125rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {item.product_name}
                              {item.variant_name && <span style={{ color: "var(--text-muted)" }}> ({item.variant_name})</span>}
                              <span style={{ color: "var(--text-muted)" }}> &times; {item.quantity}</span>
                            </span>
                            <span style={{ fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(order.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--glow-green)" }}>
                            ₦{order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
