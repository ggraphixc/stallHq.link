"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, formatNaira, getPlanName } from "@/lib/subscription";
import { SubscriptionPlan } from "@/types";
import {
  Check,
  ArrowLeft,
  Crown,
  Zap,
  Star,
  ShieldCheck,
  Package,
  Palette,
  BarChart3,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
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
      "rgba(168,133,247,0.12)",
      "rgba(6,182,212,0.1)",
      "rgba(16,185,129,0.08)",
      "rgba(236,72,153,0.06)",
    ];

    const dots = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
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

/* ── Styles ─────────────────────────────────────── */

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const popularCard: React.CSSProperties = {
  ...glassCard,
  border: "2px solid var(--glow-green)",
  background: "rgba(16,185,129,0.04)",
};

/* ── Plan Icons ─────────────────────────────────── */

const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
  trial: <Zap size={20} style={{ color: "var(--text-muted)" }} />,
  monthly: <Package size={20} style={{ color: "var(--glow-purple)" }} />,
  quarterly: <Star size={20} style={{ color: "var(--glow-green)" }} />,
  annual: <Crown size={20} style={{ color: "var(--glow-cyan)" }} />,
};

/* ── Main Component ─────────────────────────────── */

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plans: SubscriptionPlan[] = ["monthly", "quarterly", "annual"];
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check for payment success redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
      // Clean up URL
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      // Redirect to Paystack checkout
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
        <div style={{
          maxWidth: "60rem",
          margin: "0 auto",
          padding: "0 1rem",
          height: "3.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <a href="/dashboard" style={{
            width: "2.75rem",
            height: "2.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "0.5rem",
            border: "1px solid var(--border-subtle)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}>
            <ArrowLeft size={16} />
          </a>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Upgrade Your Plan</h1>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Choose the plan that fits your business</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "60rem", margin: "0 auto", padding: "2rem 1rem", position: "relative", zIndex: 1 }}>
        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div style={{
            ...glassCard,
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(16,185,129,0.06)",
            borderColor: "rgba(16,185,129,0.2)",
          }} className="slide-up">
            <CheckCircle2 size={20} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Payment successful!</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Your plan has been upgraded. Redirecting to dashboard...</p>
            </div>
            <a href="/dashboard" style={{
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              background: "var(--glow-green)",
              color: "white",
              borderRadius: "0.5rem",
              textDecoration: "none",
            }}>
              Go to Dashboard
            </a>
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}>
            <Crown size={20} style={{ color: "var(--glow-purple)" }} />
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "0.5rem" }}>
            Grow Your Business
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: "30rem", margin: "0 auto" }}>
            Pick a plan that scales with your hustle. All plans include WhatsApp checkout and a custom store URL.
          </p>
        </div>

        {/* Plan Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "1.25rem",
          marginBottom: "3rem",
        }}>
          {plans.map((planKey) => {
            const plan = PLANS[planKey];
            const isPopular = plan.popular;
            return (
              <div
                key={planKey}
                style={isPopular ? popularCard : glassCard}
                className={isPopular ? "slide-up" : "fade-in"}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div style={{
                    padding: "0.375rem 0.75rem",
                    background: "var(--glow-green)",
                    color: "white",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    textAlign: "center",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderRadius: "0.75rem 0.75rem 0 0",
                  }}>
                    Most Popular / Best Value
                  </div>
                )}

                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Plan header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.5rem",
                      background: isPopular ? "rgba(16,185,129,0.15)" : "rgba(168,133,247,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {planIcons[planKey]}
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{plan.name}</h2>
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 800 }}>
                        {plan.price === 0 ? "Free" : formatNaira(plan.price)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {plan.billingLabel}
                      {plan.monthlyBreakdown > 0 && (
                        <span> — {formatNaira(plan.monthlyBreakdown)}/month</span>
                      )}
                    </p>
                    {plan.savings && (
                      <span style={{
                        display: "inline-block",
                        marginTop: "0.375rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: "rgba(16,185,129,0.1)",
                        color: "var(--glow-green)",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
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
                      width: "100%",
                      padding: "0.75rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      opacity: loadingPlan && loadingPlan !== planKey ? 0.5 : 1,
                      cursor: loadingPlan ? "not-allowed" : "pointer",
                    }}
                    disabled={!!loadingPlan}
                    onClick={() => handlePayment(planKey)}
                  >
                    {loadingPlan === planKey ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        Processing...
                      </span>
                    ) : plan.price === 0 ? "Get Started Free" : `Pay ${formatNaira(plan.price)}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, textAlign: "center", marginBottom: "1.25rem" }}>
            Common Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              {
                q: "Can I change plans later?",
                a: "Yes! You can upgrade anytime. When you upgrade, you'll get immediate access to your new plan's features.",
              },
              {
                q: "What happens when my trial ends?",
                a: "Your store goes offline and products are hidden. Upgrade anytime to bring it back live — your data is preserved.",
              },
              {
                q: "Do I get a refund if I downgrade?",
                a: "We don't offer refunds for partial periods, but you'll keep your current plan's features until it expires.",
              },
              {
                q: "How do payments work?",
                a: "We accept bank transfers via Paystack. Your subscription starts immediately after payment confirmation.",
              },
            ].map(({ q, a }) => (
              <div key={q} style={{ ...glassCard, padding: "1rem" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>{q}</p>
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
