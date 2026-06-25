"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, COMPARISON_FEATURES, formatNaira } from "@/lib/subscription";
import { SubscriptionPlan } from "@/types";
import {
  Check,
  X as XIcon,
  ArrowLeft,
  Crown,
  Zap,
  Star,
  Package,
  Palette,
  BarChart3,
  ShieldCheck,
  Headphones,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ── Particle canvas ────────────────────────────── */

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colors = [
      "rgba(168,133,247,0.1)",
      "rgba(6,182,212,0.08)",
      "rgba(16,185,129,0.06)",
    ];

    const dots = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > w) d.dx *= -1;
        if (d.y < 0 || d.y > h) d.dy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

/* ── Plan Icon ──────────────────────────────────── */

function PlanIcon({ plan, size = 20 }: { plan: SubscriptionPlan; size?: number }) {
  const colors: Record<SubscriptionPlan, string> = {
    trial: "var(--text-muted)",
    monthly: "var(--glow-purple)",
    quarterly: "var(--glow-green)",
    annual: "var(--glow-cyan)",
  };
  const icons: Record<SubscriptionPlan, React.ReactNode> = {
    trial: <Zap size={size} />,
    monthly: <Package size={size} />,
    quarterly: <Star size={size} />,
    annual: <Crown size={size} />,
  };
  return <span style={{ color: colors[plan] }}>{icons[plan]}</span>;
}

/* ── Main Component ─────────────────────────────── */

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paidPlans: SubscriptionPlan[] = ["monthly", "quarterly", "annual"];
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "upfront">("upfront");

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
      router.replace("/upgrade");
    }
  }, [searchParams, router]);

  const handlePayment = useCallback(async (plan: SubscriptionPlan) => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize payment");
      window.location.href = data.authorization_url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setLoadingPlan(null);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      <Particles />

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(6,6,11,0.85)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1rem", height: "3.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a href="/dashboard" style={{
            width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.03)",
            color: "var(--text-secondary)", textDecoration: "none",
          }}>
            <ArrowLeft size={16} />
          </a>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Upgrade Plan</h1>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Scale your business with StallHq</p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "2.5rem 1rem", position: "relative", zIndex: 1 }}>
        {/* Payment Success */}
        {paymentSuccess && (
          <div style={{
            padding: "1rem 1.25rem", marginBottom: "2rem", borderRadius: "0.75rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
            background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
          }} className="slide-up">
            <CheckCircle2 size={20} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Payment successful!</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Your plan has been upgraded.</p>
            </div>
            <a href="/dashboard" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", fontWeight: 600, background: "var(--glow-green)", color: "white", borderRadius: "0.5rem", textDecoration: "none" }}>
              Dashboard
            </a>
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "3rem", height: "3rem", borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
          }}>
            <Crown size={18} style={{ color: "var(--glow-purple)" }} />
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
            Grow Your Store, Your Way
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: "28rem", margin: "0 auto" }}>
            Start with a free trial. Upgrade when you&apos;re ready to scale. No hidden fees, no surprises.
          </p>
        </div>

        {/* Plan Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "1rem",
          marginBottom: "3.5rem",
        }}>
          {paidPlans.map((planKey) => {
            const plan = PLANS[planKey];
            const isPopular = plan.popular;
            const isLoading = loadingPlan === planKey;
            const monthlyPrice = Math.round(plan.price / (planKey === "monthly" ? 1 : planKey === "quarterly" ? 3 : 6));

            return (
              <div
                key={planKey}
                style={{
                  borderRadius: "1rem",
                  overflow: "hidden",
                  border: isPopular ? "2px solid var(--glow-green)" : "1px solid var(--border-subtle)",
                  background: isPopular ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.02)",
                  transition: "transform 0.2s, border-color 0.2s",
                  position: "relative",
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div style={{
                    background: "var(--glow-green)", color: "white",
                    fontSize: "0.625rem", fontWeight: 700, textAlign: "center",
                    letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.375rem",
                  }}>
                    Most Popular
                  </div>
                )}

                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{
                      width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                      background: `${plan.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <PlanIcon plan={planKey} size={16} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{plan.name}</h2>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.025em" }}>
                        {formatNaira(plan.price)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {plan.billingLabel} — {formatNaira(monthlyPrice)}/month
                    </p>
                    {plan.savings && (
                      <span style={{
                        display: "inline-block", marginTop: "0.375rem",
                        padding: "0.1875rem 0.5rem", borderRadius: "0.25rem",
                        background: "rgba(16,185,129,0.1)", color: "var(--glow-green)",
                        fontSize: "0.6875rem", fontWeight: 600,
                      }}>
                        {plan.savings}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                        <Check size={14} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    className={isPopular ? "glow-button" : "glow-button-secondary"}
                    style={{
                      width: "100%", padding: "0.75rem", fontSize: "0.875rem", fontWeight: 600,
                      opacity: loadingPlan && loadingPlan !== planKey ? 0.5 : 1,
                      cursor: loadingPlan ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    }}
                    disabled={!!loadingPlan}
                    onClick={() => handlePayment(planKey)}
                  >
                    {isLoading ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <>
                        Get {plan.name}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, textAlign: "center", marginBottom: "1.5rem" }}>
            Compare all features
          </h2>
          <div style={{
            borderRadius: "0.75rem",
            border: "1px solid var(--border-subtle)",
            overflow: "hidden",
            background: "rgba(255,255,255,0.02)",
          }}>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.5fr repeat(4, 1fr)",
              borderBottom: "1px solid var(--border-subtle)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ padding: "0.75rem 1rem", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Feature
              </div>
              {(["trial", "monthly", "quarterly", "annual"] as SubscriptionPlan[]).map((p) => (
                <div key={p} style={{
                  padding: "0.75rem 0.5rem", textAlign: "center", fontSize: "0.6875rem", fontWeight: 600,
                  color: PLANS[p].color, textTransform: "uppercase", letterSpacing: "0.03em",
                  borderLeft: "1px solid var(--border-subtle)",
                }}>
                  {PLANS[p].name}
                </div>
              ))}
            </div>

            {/* Rows */}
            {COMPARISON_FEATURES.map((feature, i) => (
              <div
                key={feature.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr repeat(4, 1fr)",
                  borderBottom: i < COMPARISON_FEATURES.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <div style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {feature.name}
                </div>
                {(["trial", "monthly", "quarterly", "annual"] as SubscriptionPlan[]).map((p) => {
                  const val = feature[p];
                  return (
                    <div key={p} style={{
                      padding: "0.625rem 0.5rem", textAlign: "center", borderLeft: "1px solid var(--border-subtle)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {typeof val === "boolean" ? (
                        val ? (
                          <Check size={14} style={{ color: "var(--glow-green)" }} />
                        ) : (
                          <XIcon size={14} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                        )
                      ) : (
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-primary)" }}>{val}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
          gap: "1rem",
          marginBottom: "3.5rem",
        }}>
          {[
            { icon: <ShieldCheck size={18} />, title: "Secure Payments", desc: "Pay with card, bank transfer, or USSD via Paystack" },
            { icon: <Package size={18} />, title: "Instant Access", desc: "Your plan activates immediately after payment" },
            { icon: <Headphones size={18} />, title: "We Help You", desc: "Reach out anytime — we respond fast" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              padding: "1rem", borderRadius: "0.75rem",
              border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)",
              textAlign: "center",
            }}>
              <div style={{ color: "var(--glow-purple)", marginBottom: "0.5rem" }}>{icon}</div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.125rem" }}>{title}</p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, textAlign: "center", marginBottom: "1.25rem" }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { q: "Can I upgrade or downgrade later?", a: "Yes. Upgrade anytime from your dashboard — you'll get instant access to new features. Downgrade takes effect at the end of your current billing period." },
              { q: "What happens when my trial ends?", a: "Your store goes offline but all your data (products, orders, settings) is preserved. Upgrade anytime to bring it back live — nothing is lost." },
              { q: "Do I get a refund if I change my mind?", a: "We don't offer refunds for partial periods, but you keep your current features until the billing period ends. You can cancel anytime." },
              { q: "What payment methods do you accept?", a: "We accept debit cards, bank transfers, and USSD via Paystack — one of Africa's most trusted payment processors." },
              { q: "Will I lose my products if I downgrade?", a: "No. Your products are always saved. If you downgrade to a plan with a lower product limit, you just can't add new ones until you upgrade again." },
            ].map(({ q, a }) => (
              <div key={q} style={{
                padding: "1rem", borderRadius: "0.75rem",
                border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)",
              }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>{q}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
