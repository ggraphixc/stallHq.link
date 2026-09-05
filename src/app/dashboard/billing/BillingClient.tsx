"use client";

import { useState } from "react";
import { Store } from "@/types";
import { PLANS, getDaysRemaining, getPlanName, formatNaira, isSubscriptionActive } from "@/lib/subscription";
import { Download, CreditCard, Calendar, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

interface Payment {
  id: string;
  store_id: string;
  plan: string;
  amount: number;
  currency: string;
  paystack_reference: string;
  paystack_status: string;
  created_at: string;
  updated_at: string;
}

interface BillingClientProps {
  store: Store;
  payments: Payment[];
}

export function BillingClient({ store, payments }: BillingClientProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const active = isSubscriptionActive(store);
  const daysLeft = getDaysRemaining(store);
  const planInfo = PLANS[store.plan];
  const successPayments = payments.filter(p => p.paystack_status === "success");
  const totalSpent = successPayments.reduce((sum, p) => sum + p.amount, 0);

  const downloadInvoice = async (paymentId: string) => {
    setDownloading(paymentId);
    try {
      const res = await fetch(`/api/invoices/${paymentId}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INV-${paymentId.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Billing & Subscription</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage your plan, view payment history, and download invoices.</p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--glow-purple-dim, rgba(168,85,247,0.15))" }}>
              <CreditCard size={20} className="text-[var(--glow-purple)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text)]">{planInfo?.name || store.plan} Plan</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {store.plan === "trial" ? "Free trial" : formatNaira(planInfo?.price || 0)}
                {planInfo?.billingLabel ? ` · ${planInfo.billingLabel}` : ""}
              </p>
            </div>
          </div>
          <a
            href="/upgrade"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: "var(--glow-purple)",
              color: "#fff",
            }}
          >
            {active ? "Change Plan" : "Upgrade"}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
            <div className="flex items-center gap-2 mb-2">
              {active ? (
                <CheckCircle size={14} className="text-[var(--glow-green)]" />
              ) : (
                <AlertTriangle size={14} className="text-[var(--glow-red)]" />
              )}
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</span>
            </div>
            <p className="text-lg font-bold" style={{ color: active ? "var(--glow-green)" : "var(--glow-red)" }}>
              {active ? "Active" : "Expired"}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-[var(--glow-purple)]" />
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Expires</span>
            </div>
            <p className="text-lg font-bold text-[var(--text)]">
              {store.plan === "trial"
                ? store.trial_ends_at
                  ? new Date(store.trial_ends_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
                  : "N/A"
                : store.subscription_expires_at
                  ? new Date(store.subscription_expires_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
                  : "N/A"
              }
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-[var(--glow-cyan)]" />
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Days Left</span>
            </div>
            <p className="text-lg font-bold text-[var(--text)]">
              {daysLeft !== null ? daysLeft : "—"}
            </p>
          </div>
        </div>

        {/* Product Usage */}
        <div className="mt-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Product Limit</span>
            <span className="text-sm font-bold text-[var(--text)]">
              {planInfo?.productLimit === 0 ? "Unlimited" : `${planInfo?.productLimit || 0} products`}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-[var(--text)]">Payment History</h2>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Total spent</p>
            <p className="text-lg font-bold text-[var(--glow-green)]">{formatNaira(totalSpent)}</p>
          </div>
        </div>

        {successPayments.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <CreditCard size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No payments yet</p>
            <p className="text-xs mt-1">Your payment history will appear here after you upgrade.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {successPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--glow-green-dim, rgba(16,185,129,0.15))" }}>
                    <CheckCircle size={18} className="text-[var(--glow-green)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {getPlanName(payment.plan as any)} Plan
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(payment.created_at).toLocaleDateString("en-NG", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                      {" · "}
                      <span className="font-mono text-[10px]">{payment.paystack_reference.slice(0, 20)}…</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[var(--glow-green)]">
                    {formatNaira(payment.amount)}
                  </span>
                  <button
                    onClick={() => downloadInvoice(payment.id)}
                    disabled={downloading === payment.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Download size={12} />
                    {downloading === payment.id ? "..." : "Invoice"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
