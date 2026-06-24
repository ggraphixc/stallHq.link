"use client";

import { useState, useMemo } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Store, SubscriptionPlan } from "@/types";
import { PLANS, formatNaira, getPlanName, getDaysRemaining, isSubscriptionActive, isTrialExpired } from "@/lib/subscription";
import {
  Crown, Search, ShieldCheck, ShieldOff, Clock, Zap,
  ChevronDown, Loader2, CheckCircle2, XCircle, CreditCard, Users, TrendingUp
} from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  store_id: string;
  user_id: string;
  plan: string;
  amount: number;
  paystack_reference: string;
  paystack_status: string;
  created_at: string;
}

interface SubscriptionsClientProps {
  stores: Store[];
  payments: Payment[];
  currentUserId: string;
}

export function SubscriptionsClient({ stores, payments, currentUserId }: SubscriptionsClientProps) {
  const { error: showError, success: showSuccess, confirm: showConfirm } = useAlert();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "trial">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<string | null>(null);
  const [updatePlan, setUpdatePlan] = useState<SubscriptionPlan>("monthly");
  const [updateDays, setUpdateDays] = useState("30");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const now = new Date();

  const stats = useMemo(() => {
    const total = stores.length;
    const trials = stores.filter(s => s.plan === "trial").length;
    const paid = stores.filter(s => s.plan !== "trial").length;
    const active = stores.filter(s => isSubscriptionActive(s)).length;
    const expired = total - active;
    const totalRevenue = payments
      .filter(p => p.paystack_status === "success")
      .reduce((sum, p) => sum + p.amount, 0);
    return { total, trials, paid, active, expired, totalRevenue };
  }, [stores, payments]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      if (search && !store.name?.toLowerCase().includes(search.toLowerCase()) && !store.slug?.toLowerCase().includes(search.toLowerCase())) return false;
      if (planFilter !== "all" && store.plan !== planFilter) return false;
      if (statusFilter === "active" && !isSubscriptionActive(store)) return false;
      if (statusFilter === "expired" && isSubscriptionActive(store)) return false;
      if (statusFilter === "trial" && store.plan !== "trial") return false;
      return true;
    });
  }, [stores, search, planFilter, statusFilter]);

  const handleUpdatePlan = async (storeId: string) => {
    const confirmed = await showConfirm({
      title: `Update subscription plan`,
      message: `Change plan to "${updatePlan}"? Expiry will be set to ${new Date(now.getTime() + parseInt(updateDays || "30") * 24 * 60 * 60 * 1000).toLocaleDateString()}.`,
    });
    if (!confirmed) return;
    setUpdatingId(storeId);
    try {
      const days = parseInt(updateDays) || 30;
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: updatePlan,
          subscription_expires_at: updatePlan !== "trial" ? expiresAt : null,
          verified: updatePlan === "annual",
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      showSuccess("Subscription updated");
      setShowUpdateModal(null);
      setUpdatingId(null);
      // Refresh data by reloading
      window.location.reload();
    } catch {
      showError("Failed to update subscription");
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

  const getStatusBadge = (store: Store) => {
    if (isTrialExpired(store)) return { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    if (isSubscriptionActive(store)) return { label: "Active", color: "var(--glow-green)", bg: "rgba(16,185,129,0.1)" };
    return { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "72rem", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Crown size={20} style={{ color: "var(--glow-amber)" }} />
            Subscription Management
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Manage vendor plans and billing</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total", value: stats.total, icon: <Users size={14} />, color: "var(--glow-purple)" },
          { label: "Active", value: stats.active, icon: <CheckCircle2 size={14} />, color: "var(--glow-green)" },
          { label: "Trials", value: stats.trials, icon: <Zap size={14} />, color: "var(--glow-cyan)" },
          { label: "Paid", value: stats.paid, icon: <CreditCard size={14} />, color: "var(--glow-amber)" },
          { label: "Expired", value: stats.expired, icon: <XCircle size={14} />, color: "var(--glow-red)" },
          { label: "Revenue", value: formatNaira(stats.totalRevenue), icon: <TrendingUp size={14} />, color: "var(--glow-green)" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", padding: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
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
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as SubscriptionPlan | "all")}
          style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer" }}>
          <option value="all">All Plans</option>
          <option value="trial">Trial</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="trial">Trial Only</option>
        </select>
      </div>

      {/* Store Cards */}
      {filteredStores.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No stores found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filteredStores.map((store) => {
            const status = getStatusBadge(store);
            const daysLeft = getDaysRemaining(store);
            const isExpanded = expandedId === store.id;

            return (
              <div key={store.id} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.625rem", overflow: "hidden",
              }}>
                {/* Store Row */}
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem",
                    cursor: "pointer", minHeight: "44px",
                  }}
                  className="admin-sub-row"
                  onClick={() => setExpandedId(isExpanded ? null : store.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{store.name || "Unnamed"}</span>
                      {store.verified && <ShieldCheck size={14} style={{ color: "var(--glow-amber)" }} />}
                    </div>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      /{store.slug}
                    </p>
                  </div>
                  <span style={{
                    padding: "0.1875rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6875rem",
                    fontWeight: 600, color: getPlanColor(store.plan), background: `${getPlanColor(store.plan)}15`,
                  }} className="admin-hide-mobile">{getPlanName(store.plan)}</span>
                  <span style={{
                    padding: "0.1875rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6875rem",
                    fontWeight: 600, color: status.color, background: status.bg,
                  }}>{status.label}</span>
                  <ChevronDown size={14} style={{
                    color: "var(--text-muted)", transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  }} />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginTop: "0.75rem" }}>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Plan</p>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: getPlanColor(store.plan) }}>{getPlanName(store.plan)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Expiry</p>
                        <p style={{ fontSize: "0.8125rem" }}>
                          {daysLeft !== null ? `${daysLeft}d left` : "—"}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Verified</p>
                        <p style={{ fontSize: "0.8125rem" }}>{store.verified ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Channels</p>
                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                          {store.whatsapp_number && (
                            <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "1rem", background: "rgba(37,211,102,0.1)", color: "#25d366", border: "1px solid rgba(37,211,102,0.2)" }}>
                              WhatsApp
                            </span>
                          )}
                          {store.instagram_handle && (
                            <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "1rem", background: "rgba(225,48,108,0.1)", color: "#e1306c", border: "1px solid rgba(225,48,108,0.2)" }}>
                              Instagram
                            </span>
                          )}
                          {!store.whatsapp_number && !store.instagram_handle && (
                            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>None</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                      <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem",
                        fontSize: "0.75rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
                        borderRadius: "0.375rem", color: "var(--glow-purple)", textDecoration: "none", minHeight: "44px",
                      }}>
                        View Store
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowUpdateModal(store.id); setUpdatePlan(store.plan); setUpdateDays("30"); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem",
                          fontSize: "0.75rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
                          borderRadius: "0.375rem", color: "var(--glow-purple)", cursor: "pointer", minHeight: "44px",
                        }}
                      >
                        Update Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Payments */}
      <div style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CreditCard size={16} style={{ color: "var(--glow-green)" }} />
          Recent Payments
        </h2>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {payments.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>No payments yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {payments.slice(0, 10).map((payment) => (
                <div key={payment.id} style={{
                  padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: payment.paystack_status === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {payment.paystack_status === "success" ? <CheckCircle2 size={14} style={{ color: "var(--glow-green)" }} /> : <XCircle size={14} style={{ color: "var(--glow-red)" }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{getPlanName(payment.plan as SubscriptionPlan)}</p>
                      <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payment.paystack_reference}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--glow-green)" }}>{formatNaira(payment.amount / 100)}</p>
                    <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Plan Modal */}
      {showUpdateModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateModal(null); }}
        >
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.5rem", maxWidth: "24rem", width: "100%" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Update Subscription</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem", textTransform: "uppercase" }}>Plan</label>
                <select value={updatePlan} onChange={(e) => setUpdatePlan(e.target.value as SubscriptionPlan)}
                  style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer" }}>
                  <option value="trial">Trial</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              {updatePlan !== "trial" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem", textTransform: "uppercase" }}>Days to Add</label>
                  <input type="number" value={updateDays} onChange={(e) => setUpdateDays(e.target.value)} min="1" max="365"
                    style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)" }} />
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Expires: {new Date(now.getTime() + parseInt(updateDays || "30") * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button onClick={() => setShowUpdateModal(null)}
                  style={{ flex: 1, padding: "0.625rem", fontSize: "0.8125rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", minHeight: "44px" }}>
                  Cancel
                </button>
                <button onClick={() => handleUpdatePlan(showUpdateModal)} disabled={updatingId === showUpdateModal}
                  className="glow-button"
                  style={{ flex: 1, padding: "0.625rem", fontSize: "0.8125rem", opacity: updatingId === showUpdateModal ? 0.5 : 1, cursor: updatingId === showUpdateModal ? "not-allowed" : "pointer", minHeight: "44px" }}>
                  {updatingId === showUpdateModal ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Updating...
                    </span>
                  ) : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-sub-row { grid-template-columns: 1fr auto auto !important; }
        }
      `}</style>
    </div>
  );
}
