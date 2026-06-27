"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Store, SubscriptionPlan } from "@/types";
import { PLANS, getPlanName, getDaysRemaining, isSubscriptionActive } from "@/lib/subscription";
import {
  Store as StoreIcon, Search, RefreshCw, ExternalLink, ShieldCheck,
  ShieldOff, Clock, Crown, Loader2, ChevronDown, Eye, Trash2
} from "lucide-react";
import Link from "next/link";

interface StoreWithCount extends Store {
  product_count: number;
}

export function AdminStores() {
  const { error: showError, success: showSuccess } = useAlert();
  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/stores?${params}`);
      const data = await res.json();
      setStores(data.stores || []);
      setTotal(data.total || 0);
    } catch {
      showError("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, [page, planFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStores();
  };

  const handleUpdateStore = async (storeId: string, updates: Record<string, unknown>) => {
    setUpdatingId(storeId);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        showSuccess("Store updated");
        fetchStores();
      } else {
        showError("Failed to update store");
      }
    } catch {
      showError("Failed to update store");
    } finally {
      setUpdatingId(null);
    }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "trial": return "var(--text-muted)";
      case "monthly": return "var(--glow-cyan)";
      case "quarterly": return "var(--glow-green)";
      case "annual": return "var(--glow-amber)";
    }
  };

  return (
    <div style={{ padding: "clamp(1rem,3vw,1.5rem)", maxWidth: "72rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <StoreIcon size={20} style={{ color: "var(--glow-purple)" }} />
            Store Management
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{total} total stores</p>
        </div>
        <button onClick={fetchStores} style={{
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
            type="text" placeholder="Search stores..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.625rem 0.75rem 0.625rem 2rem", fontSize: "0.8125rem",
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
            }}
          />
        </div>
        <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value as SubscriptionPlan | "all"); setPage(1); }}
          style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer" }}>
          <option value="all">All Plans</option>
          <option value="trial">Trial</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
          style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </form>

      {/* Store List */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
        </div>
      ) : stores.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No stores found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {stores.map((store) => {
            const daysLeft = getDaysRemaining(store);
            const active = isSubscriptionActive(store);
            const isExpanded = expandedId === store.id;

            return (
              <div key={store.id} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.625rem", overflow: "hidden",
              }}>
                {/* Store Row */}
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr auto",
                    alignItems: "center", gap: "0.5rem", padding: "0.875rem 1rem",
                    cursor: "pointer", minHeight: "44px",
                  }}
                  className="admin-store-row"
                  onClick={() => setExpandedId(isExpanded ? null : store.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{store.name || "Unnamed"}</span>
                      {store.verified && <ShieldCheck size={14} style={{ color: "var(--glow-amber)" }} />}
                      <span style={{
                        padding: "0.1875rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6875rem",
                        fontWeight: 600, color: getPlanColor(store.plan), background: `${getPlanColor(store.plan)}15`,
                      }}>{getPlanName(store.plan)}</span>
                      <span style={{
                        padding: "0.1875rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6875rem",
                        fontWeight: 600, color: active ? "var(--glow-green)" : "var(--glow-red)",
                        background: active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      }}>{active ? "Active" : "Expired"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/{store.slug}</p>
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>·</span>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{store.category || "Uncategorized"}</p>
                      {store.whatsapp_number && (
                        <span style={{ fontSize: "0.5625rem", padding: "0.0625rem 0.375rem", borderRadius: "1rem", background: "rgba(37,211,102,0.1)", color: "#25d366", border: "1px solid rgba(37,211,102,0.2)", whiteSpace: "nowrap" }}>WA</span>
                      )}
                      {store.instagram_handle && (
                        <span style={{ fontSize: "0.5625rem", padding: "0.0625rem 0.375rem", borderRadius: "1rem", background: "rgba(225,48,108,0.1)", color: "#e1306c", border: "1px solid rgba(225,48,108,0.2)", whiteSpace: "nowrap" }}>IG</span>
                      )}
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>·</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{daysLeft !== null ? `${daysLeft}d` : "—"}</span>
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>·</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{store.product_count} products</span>
                    </div>
                  </div>
                  <ChevronDown size={14} style={{
                    color: "var(--text-muted)", transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }} />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>WhatsApp</p>
                        <p style={{ fontSize: "0.8125rem" }}>{store.whatsapp_number || "Not set"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Instagram</p>
                        <p style={{ fontSize: "0.8125rem" }}>{store.instagram_handle ? `@${store.instagram_handle.replace(/^@/, "")}` : "Not set"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Email</p>
                        <p style={{ fontSize: "0.8125rem" }}>{store.email || "Not set"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Created</p>
                        <p style={{ fontSize: "0.8125rem" }}>{new Date(store.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Expiry</p>
                        <p style={{ fontSize: "0.8125rem" }}>
                          {store.plan === "trial"
                            ? (store.trial_ends_at ? new Date(store.trial_ends_at).toLocaleDateString() : "N/A")
                            : (store.subscription_expires_at ? new Date(store.subscription_expires_at).toLocaleDateString() : "N/A")}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                      <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem",
                        fontSize: "0.75rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
                        borderRadius: "0.375rem", color: "var(--glow-purple)", textDecoration: "none", minHeight: "44px",
                      }}>
                        <ExternalLink size={12} /> View Store
                      </a>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateStore(store.id, { verified: !store.verified }); }}
                        disabled={updatingId === store.id} style={{
                          display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem",
                          fontSize: "0.75rem", background: store.verified ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                          border: `1px solid ${store.verified ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
                          borderRadius: "0.375rem", color: store.verified ? "var(--glow-amber)" : "var(--glow-green)",
                          cursor: "pointer", minHeight: "44px",
                        }}>
                        {updatingId === store.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : store.verified ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                        {store.verified ? "Remove Badge" : "Verify"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", opacity: page === 1 ? 0.5 : 1, minHeight: "44px" }}>
            Previous
          </button>
          <span style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={stores.length < 50}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", opacity: stores.length < 50 ? 0.5 : 1, minHeight: "44px" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
