"use client";

import { useState, useMemo } from "react";
import { Store, SubscriptionPlan } from "@/types";
import { PLANS, formatNaira, getPlanName, getDaysRemaining, isSubscriptionActive, isTrialExpired } from "@/lib/subscription";
import {
  Crown, Search, Filter, ShieldCheck, ShieldOff, Clock, Zap,
  AlertTriangle, ChevronDown, Loader2, CheckCircle2, XCircle, ArrowLeft, CreditCard, Users, TrendingUp
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
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "trial">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<string | null>(null);
  const [updatePlan, setUpdatePlan] = useState<SubscriptionPlan>("monthly");
  const [updateDays, setUpdateDays] = useState("30");

  const now = new Date();

  // Stats
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

  // Filtered stores
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
      window.location.reload();
    } catch {
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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8125rem" }}>
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Crown size={20} style={{ color: "var(--glow-amber)" }} />
                Subscription Management
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Manage vendor plans and billing</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Stores", value: stats.total, icon: <Users size={16} />, color: "var(--glow-purple)" },
            { label: "Active Plans", value: stats.active, icon: <CheckCircle2 size={16} />, color: "var(--glow-green)" },
            { label: "Free Trials", value: stats.trials, icon: <Zap size={16} />, color: "var(--glow-cyan)" },
            { label: "Paid Vendors", value: stats.paid, icon: <CreditCard size={16} />, color: "var(--glow-amber)" },
            { label: "Expired", value: stats.expired, icon: <XCircle size={16} />, color: "var(--glow-red)" },
            { label: "Revenue", value: formatNaira(stats.totalRevenue / 100), icon: <TrendingUp size={16} />, color: "var(--glow-green)" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "0.625rem 0.75rem 0.625rem 2rem",
                fontSize: "0.8125rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
              }}
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as SubscriptionPlan | "all")}
            style={{
              padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)",
              cursor: "pointer", outline: "none",
            }}
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{
              padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)",
              cursor: "pointer", outline: "none",
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="trial">Trial Only</option>
          </select>
        </div>

        {/* Store Table */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Store</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plan</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiry</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Verified</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No stores found
                    </td>
                  </tr>
                ) : filteredStores.map((store) => {
                  const status = getStatusBadge(store);
                  const daysLeft = getDaysRemaining(store);

                  return (
                    <tr key={store.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div>
                          <p style={{ fontWeight: 600, marginBottom: "0.125rem" }}>{store.name || "Unnamed"}</p>
                          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>/{store.slug}</p>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{
                          display: "inline-block", padding: "0.1875rem 0.5rem", borderRadius: "0.25rem",
                          fontSize: "0.6875rem", fontWeight: 600, color: getPlanColor(store.plan),
                          background: `${getPlanColor(store.plan)}15`,
                        }}>
                          {getPlanName(store.plan)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                          padding: "0.1875rem 0.5rem", borderRadius: "0.25rem",
                          fontSize: "0.6875rem", fontWeight: 600, color: status.color, background: status.bg,
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {daysLeft !== null ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Clock size={12} />
                            {daysLeft}d left
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {store.verified ? (
                          <ShieldCheck size={16} style={{ color: "var(--glow-amber)" }} />
                        ) : (
                          <ShieldOff size={16} style={{ color: "var(--text-muted)" }} />
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => {
                            setShowUpdateModal(store.id);
                            setUpdatePlan(store.plan);
                            setUpdateDays("30");
                          }}
                          style={{
                            padding: "0.375rem 0.75rem", fontSize: "0.6875rem", fontWeight: 600,
                            background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.2)",
                            borderRadius: "0.375rem", color: "var(--glow-purple)", cursor: "pointer",
                          }}
                        >
                          Update Plan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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
                  <div key={payment.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: payment.paystack_status === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {payment.paystack_status === "success" ? <CheckCircle2 size={14} style={{ color: "var(--glow-green)" }} /> : <XCircle size={14} style={{ color: "var(--glow-red)" }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{getPlanName(payment.plan as SubscriptionPlan)}</p>
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{payment.paystack_reference}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--glow-green)" }}>{formatNaira(payment.amount / 100)}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                <select
                  value={updatePlan}
                  onChange={(e) => setUpdatePlan(e.target.value as SubscriptionPlan)}
                  style={{
                    width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
                    background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                    borderRadius: "0.5rem", color: "var(--text-primary)", cursor: "pointer",
                  }}
                >
                  <option value="trial">Trial</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              {updatePlan !== "trial" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem", textTransform: "uppercase" }}>Days to Add</label>
                  <input
                    type="number"
                    value={updateDays}
                    onChange={(e) => setUpdateDays(e.target.value)}
                    min="1"
                    max="365"
                    style={{
                      width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
                      background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                      borderRadius: "0.5rem", color: "var(--text-primary)",
                    }}
                  />
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Expires: {new Date(now.getTime() + parseInt(updateDays || "30") * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => setShowUpdateModal(null)}
                  style={{
                    flex: 1, padding: "0.625rem", fontSize: "0.8125rem", background: "transparent",
                    border: "1px solid var(--border-subtle)", borderRadius: "0.5rem",
                    color: "var(--text-secondary)", cursor: "pointer", minHeight: "44px",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdatePlan(showUpdateModal)}
                  disabled={updatingId === showUpdateModal}
                  className="glow-button"
                  style={{
                    flex: 1, padding: "0.625rem", fontSize: "0.8125rem",
                    opacity: updatingId === showUpdateModal ? 0.5 : 1,
                    cursor: updatingId === showUpdateModal ? "not-allowed" : "pointer",
                    minHeight: "44px",
                  }}
                >
                  {updatingId === showUpdateModal ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Updating...
                    </span>
                  ) : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
