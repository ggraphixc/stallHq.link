"use client";

import { useState } from "react";
import { Store, SubscriptionPlan } from "@/types";
import { PLANS, formatNaira } from "@/lib/subscription";
import { Check, ArrowRight, Crown, Zap, Star, Package, Loader2 } from "lucide-react";

interface PlanSelectionStepProps {
  store: Store;
  onPlanSelected: () => void;
  onSkip: () => void;
}

const PLAN_ICONS: Record<SubscriptionPlan, React.ReactNode> = {
  trial: <Zap size={14} />,
  monthly: <Package size={14} />,
  quarterly: <Star size={14} />,
  annual: <Crown size={14} />,
};

export function PlanSelectionStep({ store, onPlanSelected, onSkip }: PlanSelectionStepProps) {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  const handlePayment = async (plan: SubscriptionPlan) => {
    if (plan === "trial") {
      onSkip();
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setLoadingPlan(null);
    }
  };

  const paidPlans: SubscriptionPlan[] = ["monthly", "quarterly", "annual"];

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{
          width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem",
          background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))",
          border: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem",
        }}>
          <Crown size={16} style={{ color: "var(--glow-purple)" }} />
        </div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>Choose Your Plan</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Start free, upgrade anytime</p>
      </div>

      {/* Plan Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {paidPlans.map((planKey) => {
          const plan = PLANS[planKey];
          const isPopular = plan.popular;
          const isLoading = loadingPlan === planKey;
          const monthlyPrice = Math.round(plan.price / (planKey === "monthly" ? 1 : planKey === "quarterly" ? 3 : 6));

          return (
            <div
              key={planKey}
              style={{
                background: isPopular ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.02)",
                border: isPopular ? "1.5px solid rgba(16,185,129,0.3)" : "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
                padding: "1rem",
                position: "relative",
                transition: "border-color 0.2s",
              }}
            >
              {isPopular && (
                <div style={{
                  position: "absolute", top: "-0.5rem", right: "0.75rem",
                  padding: "0.125rem 0.5rem", borderRadius: "0.25rem",
                  background: "var(--glow-green)", color: "white",
                  fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Best Value
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "2rem", height: "2rem", borderRadius: "0.5rem",
                    background: `${plan.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                    color: plan.color,
                  }}>
                    {PLAN_ICONS[planKey]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{plan.name}</h3>
                    <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{plan.tagline}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 700 }}>{formatNaira(plan.price)}</span>
                  <span style={{ display: "block", fontSize: "0.5625rem", color: "var(--text-muted)" }}>
                    {formatNaira(monthlyPrice)}/mo
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.75rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {plan.features.slice(0, 3).map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem" }}>
                    <Check size={11} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
                  </li>
                ))}
                {plan.savings && (
                  <li style={{ fontSize: "0.625rem", color: "var(--glow-green)", fontWeight: 600, marginTop: "0.125rem" }}>
                    {plan.savings}
                  </li>
                )}
              </ul>

              {/* CTA */}
              <button
                className={isPopular ? "glow-button" : "glow-button-secondary"}
                style={{
                  width: "100%", padding: "0.625rem", fontSize: "0.8125rem", fontWeight: 600,
                  opacity: loadingPlan && loadingPlan !== planKey ? 0.5 : 1,
                  cursor: loadingPlan ? "not-allowed" : "pointer",
                }}
                disabled={!!loadingPlan}
                onClick={() => handlePayment(planKey)}
              >
                {isLoading ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                    Pay {formatNaira(plan.price)}
                    <ArrowRight size={13} />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Free trial */}
      <button
        onClick={onSkip}
        disabled={!!loadingPlan}
        style={{
          width: "100%", padding: "0.75rem", marginTop: "0.75rem",
          fontSize: "0.8125rem", color: "var(--text-muted)",
          background: "transparent", border: "1px solid var(--border-subtle)",
          borderRadius: "0.5rem", cursor: loadingPlan ? "not-allowed" : "pointer",
          opacity: loadingPlan ? 0.5 : 1, minHeight: "44px",
        }}
      >
        Start with free trial instead
      </button>
    </div>
  );
}
