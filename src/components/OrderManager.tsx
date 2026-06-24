"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Order } from "@/types";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, Loader2, Download, StickyNote } from "lucide-react";

interface OrderManagerProps {
  storeId: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "var(--glow-yellow, #facc15)", bg: "rgba(250,204,21,0.1)" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "var(--glow-blue, #60a5fa)", bg: "rgba(96,165,250,0.1)" },
  shipped: { label: "Shipped", icon: Truck, color: "var(--glow-purple)", bg: "rgba(168,133,247,0.1)" },
  delivered: { label: "Delivered", icon: Package, color: "var(--glow-green)", bg: "rgba(16,185,129,0.1)" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "var(--glow-red)", bg: "rgba(239,68,68,0.1)" },
} as const;

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const inputStyle: React.CSSProperties = {
  padding: "0.375rem 1.75rem 0.375rem 0.625rem",
  fontSize: "0.75rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  appearance: "none" as const,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

export function OrderManager({ storeId }: OrderManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const { error: showError, success: showSuccess, confirm } = useAlert();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [vendorNote, setVendorNote] = useState("");
  const [noteMode, setNoteMode] = useState<"status" | "standalone">("status");

  useEffect(() => { fetchOrders(); }, [storeId]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?store_id=${storeId}`);
      if (response.ok) setOrders(await response.json());
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: Order["status"], notes?: string) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, vendor_notes: notes || undefined }),
      });
      if (response.ok) {
        const updated = await response.json();
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status, vendor_notes: updated.vendor_notes || o.vendor_notes } : o)));
        showSuccess(noteMode === "standalone" ? "Note saved" : "Status updated");
      }
    } catch (error) {
      showError("Failed to update");
    } finally {
      setUpdatingId(null);
      setEditingNotesId(null);
      setVendorNote("");
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = orders.reduce(
    (acc, order) => { acc[order.status] = (acc[order.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const exportCSV = () => {
    const headers = ["Order ID", "Date", "Customer", "Phone", "Items", "Total", "Status", "Notes", "Vendor Note"];
    const rows = filteredOrders.map((order) => [
      order.id.slice(0, 8),
      new Date(order.created_at).toLocaleDateString("en-NG"),
      order.customer_name || "",
      order.customer_phone || "",
      order.items.map((item) => `${item.quantity}x ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}`).join("; "),
      order.total.toString(),
      order.status,
      order.notes || "",
      order.vendor_notes || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 0" }}>
        <Loader2 size={28} style={{ color: "var(--glow-purple)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.125rem" }}>Orders</h2>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", ...labelStyle }}>
            {orders.length} total order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={exportCSV}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--text-muted)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; }}
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            whiteSpace: "nowrap" as const,
            transition: "all 0.2s",
            border: "none",
            cursor: "pointer",
            background: filter === "all" ? "var(--glow-purple)" : "var(--bg-card)",
            color: filter === "all" ? "white" : "var(--text-secondary)",
          }}
        >
          All ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              whiteSpace: "nowrap" as const,
              transition: "all 0.2s",
              border: "none",
              cursor: "pointer",
              background: filter === key ? config.bg : "var(--bg-card)",
              color: filter === key ? config.color : "var(--text-secondary)",
            }}
          >
            {config.label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{ ...glassCard, padding: "3rem 1.5rem", textAlign: "center" }}>
          <Package size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            const StatusIcon = config.icon;
            return (
              <div key={order.id} style={{ ...glassCard, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <StatusIcon size={16} style={{ color: config.color }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: config.color }}>{config.label}</span>
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>

                    {order.customer_name && <p style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{order.customer_name}</p>}
                    {order.customer_phone && <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{order.customer_phone}</p>}

                    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                      {order.items.map((item, i) => (
                        <p key={i} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {item.quantity}x {item.product_name}
                          {item.variant_name && <span style={{ color: "var(--glow-purple)" }}> ({item.variant_name})</span>}
                          {" — "}
                          <span style={{ color: "var(--glow-green)" }}>₦{(item.price * item.quantity).toLocaleString()}</span>
                        </p>
                      ))}
                    </div>

                    <p style={{ marginTop: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--glow-green)" }}>
                      ₦{order.total.toLocaleString()}
                    </p>

                    {order.notes && (
                      <p style={{ marginTop: "0.5rem", fontSize: "0.6875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Note: {order.notes}
                      </p>
                    )}

                    {order.vendor_notes && (
                      <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(168,133,247,0.05)", borderRadius: "0.375rem", borderLeft: "3px solid var(--glow-purple)" }}>
                        <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--glow-purple)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>Vendor Note</p>
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>{order.vendor_notes}</p>
                      </div>
                    )}

                    <p style={{ marginTop: "0.5rem", fontSize: "0.625rem", color: "var(--text-muted)" }}>
                      {new Date(order.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Status Update + Notes */}
                  <div style={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as Order["status"];
                          if (newStatus !== order.status) {
                            setEditingNotesId(order.id);
                            setVendorNote(order.vendor_notes || "");
                            setNoteMode("status");
                          }
                        }}
                        disabled={updatingId === order.id}
                        className="ambient-input"
                        style={inputStyle}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
                    </div>

                    {/* Add Note button */}
                    {editingNotesId !== order.id && (
                      <button
                        onClick={() => {
                          setEditingNotesId(order.id);
                          setVendorNote(order.vendor_notes || "");
                          setNoteMode("standalone");
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.25rem",
                          padding: "0.375rem 0.625rem", fontSize: "0.6875rem", fontWeight: 500,
                          color: "var(--glow-purple)", background: "rgba(168,133,247,0.08)",
                          border: "1px solid rgba(168,133,247,0.2)", borderRadius: "0.25rem",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.15)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,133,247,0.08)"; }}
                      >
                        <StickyNote size={12} />
                        {order.vendor_notes ? "Edit Note" : "Add Note"}
                      </button>
                    )}

                    {/* Inline notes editor */}
                    {editingNotesId === order.id && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: "200px" }}>
                        <textarea
                          value={vendorNote}
                          onChange={(e) => setVendorNote(e.target.value)}
                          placeholder="Add a note for the customer (optional)..."
                          rows={2}
                          style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.75rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.375rem", color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                          <button onClick={() => { setEditingNotesId(null); setVendorNote(""); }}
                            style={{ padding: "0.375rem 0.625rem", fontSize: "0.6875rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "0.25rem", color: "var(--text-muted)", cursor: "pointer" }}>
                            Cancel
                          </button>
                          <button onClick={() => updateStatus(order.id, order.status, vendorNote)}
                            disabled={updatingId === order.id}
                            style={{ padding: "0.375rem 0.625rem", fontSize: "0.6875rem", background: "var(--glow-purple)", border: "none", borderRadius: "0.25rem", color: "white", cursor: "pointer", fontWeight: 600, opacity: updatingId === order.id ? 0.5 : 1 }}>
                            {updatingId === order.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
