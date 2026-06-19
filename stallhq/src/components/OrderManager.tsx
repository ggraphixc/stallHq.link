"use client";

import { useState, useEffect } from "react";
import { Order } from "@/types";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronDown,
  Loader2,
  Download,
} from "lucide-react";

interface OrderManagerProps {
  storeId: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  delivered: {
    label: "Delivered",
    icon: Package,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
} as const;

export function OrderManager({ storeId }: OrderManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?store_id=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    orderId: string,
    status: Order["status"]
  ) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setOrders(
          orders.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Phone",
      "Items",
      "Total",
      "Status",
      "Notes",
    ];

    const rows = filteredOrders.map((order) => [
      order.id.slice(0, 8),
      new Date(order.created_at).toLocaleDateString("en-NG"),
      order.customer_name || "",
      order.customer_phone || "",
      order.items
        .map(
          (item) =>
            `${item.quantity}x ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}`
        )
        .join("; "),
      order.total.toString(),
      order.status,
      order.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--glow-purple)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)]">
            {orders.length} total order{orders.length !== 1 ? "s" : ""}
          </span>
          {orders.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card)]/80 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === "all"
              ? "bg-[var(--glow-purple)] text-white"
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/80"
          }`}
        >
          All ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? `${config.bg} ${config.color}`
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/80"
            }`}
          >
            {config.label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 ambient-card">
          <Package className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)]">
            {filter === "all"
              ? "No orders yet"
              : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>

                    {order.customer_name && (
                      <p className="text-sm font-medium">
                        {order.customer_name}
                      </p>
                    )}
                    {order.customer_phone && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {order.customer_phone}
                      </p>
                    )}

                    <div className="mt-2 space-y-1">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-sm text-[var(--text-secondary)]">
                          {item.quantity}x {item.product_name}
                          {item.variant_name && (
                            <span className="text-[var(--glow-purple)]">
                              {" "}
                              ({item.variant_name})
                            </span>
                          )}
                          {" - "}
                          <span className="text-[var(--glow-green)]">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </p>
                      ))}
                    </div>

                    <p className="mt-2 text-lg font-bold text-[var(--glow-green)]">
                      ₦{order.total.toLocaleString()}
                    </p>

                    {order.notes && (
                      <p className="mt-2 text-xs text-[var(--text-muted)] italic">
                        Note: {order.notes}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {new Date(order.created_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Status Update */}
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as Order["status"])
                      }
                      disabled={updatingId === order.id}
                      className="ambient-input !py-2 !px-3 text-sm pr-8 appearance-none cursor-pointer"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--text-muted)]" />
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
