"use client";

import { useState, useEffect } from "react";
import { Order } from "@/types";
import {
  ShoppingCart, Search, RefreshCw, ChevronDown, Loader2, CheckCircle2,
  XCircle, Clock, Truck, Package
} from "lucide-react";

interface OrderWithStore extends Order {
  stores: { id: string; name: string; slug: string } | null;
}

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  pending: { color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: <Clock size={12} /> },
  confirmed: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: <CheckCircle2 size={12} /> },
  shipped: { color: "var(--glow-purple)", bg: "rgba(168,133,247,0.1)", icon: <Truck size={12} /> },
  delivered: { color: "var(--glow-green)", bg: "rgba(16,185,129,0.1)", icon: <CheckCircle2 size={12} /> },
  cancelled: { color: "var(--glow-red)", bg: "rgba(239,68,68,0.1)", icon: <XCircle size={12} /> },
};

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "72rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={20} style={{ color: "var(--glow-green)" }} />
            Order Management
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{total} total orders</p>
        </div>
        <button onClick={fetchOrders} style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
          fontSize: "0.8125rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
          borderRadius: "0.5rem", color: "var(--glow-purple)", cursor: "pointer", minHeight: "44px",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text" placeholder="Search by name, phone, email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.625rem 0.75rem 0.625rem 2rem", fontSize: "0.8125rem",
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
            }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer" }}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </form>

      {/* Orders */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No orders found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const shortId = order.id.slice(0, 8).toUpperCase();

            return (
              <div key={order.id} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.625rem", overflow: "hidden",
              }}>
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "center", gap: "1rem", padding: "0.875rem 1rem",
                    cursor: "pointer", minHeight: "44px",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", fontFamily: "monospace" }}>#{shortId}</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{order.stores?.name || "Unknown"}</span>
                    </div>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      {order.customer_name || "Anonymous"} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    padding: "0.1875rem 0.5rem", borderRadius: "0.25rem",
                    fontSize: "0.6875rem", fontWeight: 600, color: cfg.color, background: cfg.bg,
                  }}>
                    {cfg.icon} {order.status}
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--glow-green)" }}>
                    ₦{order.total?.toLocaleString() || 0}
                  </span>
                  <ChevronDown size={14} style={{
                    color: "var(--text-muted)", transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }} />
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border-subtle)" }}>
                    {/* Customer Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Customer</p>
                        <p style={{ fontSize: "0.8125rem" }}>{order.customer_name || "Anonymous"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Phone</p>
                        <p style={{ fontSize: "0.8125rem" }}>{order.customer_phone || "N/A"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Email</p>
                        <p style={{ fontSize: "0.8125rem" }}>{order.customer_email || "N/A"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Store</p>
                        <p style={{ fontSize: "0.8125rem" }}>{order.stores?.name || "Unknown"}</p>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Items</p>
                        <div style={{ background: "var(--bg-primary)", borderRadius: "0.375rem", border: "1px solid var(--border-subtle)" }}>
                          {order.items.map((item, i) => (
                            <div key={i} style={{
                              display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem",
                              borderBottom: i < order.items.length - 1 ? "1px solid var(--border-subtle)" : "none",
                            }}>
                              <span style={{ fontSize: "0.8125rem" }}>
                                {item.product_name}
                                {item.variant_name ? ` (${item.variant_name})` : ""} × {item.quantity}
                              </span>
                              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.375rem", borderLeft: "3px solid var(--glow-purple)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{order.notes}</p>
                      </div>
                    )}

                    {/* Status Update */}
                    <div style={{ marginTop: "1rem", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                      {STATUS_OPTIONS.map((s) => {
                        const sCfg = STATUS_CONFIG[s];
                        const isCurrent = order.status === s;
                        return (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, s); }}
                            disabled={isCurrent || updatingId === order.id}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.25rem",
                              padding: "0.375rem 0.625rem", fontSize: "0.6875rem", fontWeight: 600,
                              background: isCurrent ? sCfg.bg : "transparent",
                              border: `1px solid ${isCurrent ? sCfg.color : "var(--border-subtle)"}`,
                              borderRadius: "0.25rem", color: isCurrent ? sCfg.color : "var(--text-muted)",
                              cursor: isCurrent ? "default" : "pointer", opacity: updatingId === order.id ? 0.5 : 1,
                              minHeight: "44px",
                            }}
                          >
                            {updatingId === order.id ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : sCfg.icon}
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {total > 50 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", opacity: page === 1 ? 0.5 : 1, minHeight: "44px" }}>
            Previous
          </button>
          <span style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 50}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", opacity: orders.length < 50 ? 0.5 : 1, minHeight: "44px" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
