"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Store, ShoppingCart, BarChart3, QrCode, Zap, Shield, ArrowRight, Check, Star, Users, TrendingUp } from "lucide-react";

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(168, 133, 247, ${p.opacity})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.5 }} />;
}

const features = [
  { icon: Store, title: "Digital Storefront", desc: "A beautiful online store with your products, prices, and WhatsApp link — live in minutes." },
  { icon: ShoppingCart, title: "WhatsApp Orders", desc: "Customers order on your store, you get the order details straight in WhatsApp. No app needed." },
  { icon: BarChart3, title: "Order Tracking", desc: "Track every order from pending to delivered. Know what's moving and what's stuck." },
  { icon: QrCode, title: "QR Code & Links", desc: "Get a shareable link and QR code. Print it on flyers, put it on your Instagram bio." },
  { icon: Zap, title: "Instant Setup", desc: "No hosting, no coding, no developers. Create your store, add products, start selling." },
  { icon: Shield, title: "Verified Badge", desc: "Build trust with customers. Verified stores get a green badge on their storefront." },
];

const steps = [
  { n: "01", title: "Create Your Store", desc: "Pick a name, add your WhatsApp number, choose a plan that fits." },
  { n: "02", title: "Add Products", desc: "Upload photos, set prices, add variants. Done in minutes." },
  { n: "03", title: "Share & Sell", desc: "Share your link. Customers browse, order, you get paid via WhatsApp." },
];

const plans = [
  { name: "Trial", price: "Free", period: "5 days", features: ["10 products", "Basic storefront", "WhatsApp orders", "Order tracking"], cta: "Start Free Trial", popular: false },
  { name: "Monthly", price: "₦3,500", period: "/month", features: ["20 products", "Custom themes", "Priority support", "Analytics dashboard"], cta: "Go Monthly", popular: false },
  { name: "Quarterly", price: "₦7,500", period: "every 3 months", features: ["50 products", "Custom themes", "Priority support", "Analytics dashboard"], cta: "Go Quarterly", popular: true },
  { name: "Annual", price: "₦12,000", period: "every 6 months", features: ["Unlimited products", "Custom themes", "Priority support", "Analytics dashboard"], cta: "Go Annual", popular: false },
];

const testimonials = [
  { name: "Adaeze", role: "Fashion Vendor, Lagos", text: "I was using WhatsApp status to sell. Now I have a real store. My customers love it." },
  { name: "Chidi", role: "Electronics, Abuja", text: "Set it up in 10 minutes. Orders come straight to my WhatsApp. No more manual typing." },
  { name: "Fatima", role: "Skincare, Port Harcourt", text: "The QR code is a game changer. I printed it on my packaging. Customers scan and reorder." },
];

const sectionStyle: React.CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "5rem 1.5rem" };
const labelStyle: React.CSSProperties = { textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "2.5rem" };

export default function Home() {
  return (
    <>
      <Particles />
      <main className="relative z-10">
        {/* Header */}
        <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: "0.75rem" }}>S</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>StallHq</span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link href="/explore" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", textDecoration: "none" }}>
                Explore
              </Link>
              <Link href="/auth/login" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", textDecoration: "none" }}>
                Login
              </Link>
              <Link href="/auth/signup" className="glow-button" style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}>
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 1.5rem", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "var(--glow-purple)", borderRadius: "50%", opacity: 0.04, filter: "blur(140px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 10, maxWidth: 640, display: "flex", flexDirection: "column", gap: "1.25rem" }} className="fade-in">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "var(--text-secondary)", alignSelf: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--glow-green)", animation: "pulse 2s infinite" }} />
              Start with a free trial
            </div>
            <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Your WhatsApp.<br />
              <span className="text-gradient">Your Store.</span>
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
              Turn your WhatsApp into a full online store. Customers browse your products, place orders, and you get notified instantly — no app needed.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 8, flexWrap: "wrap" }}>
              <Link href="/auth/signup" className="glow-button" style={{ fontSize: 13, padding: "12px 28px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Get Started Free <ArrowRight size={14} />
              </Link>
              <Link href="/explore" className="glow-button-secondary" style={{ fontSize: 13, padding: "12px 28px" }}>
                Browse Stores
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, paddingTop: 8, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
              <span>No hosting fees</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-medium)", alignSelf: "center" }} />
              <span>Setup in 60 seconds</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-medium)", alignSelf: "center" }} />
              <span>WhatsApp native</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ padding: "3rem 1.5rem", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap" }}>
            {[
              { icon: Users, value: "500+", label: "Active Vendors" },
              { icon: ShoppingCart, value: "10K+", label: "Orders Processed" },
              { icon: TrendingUp, value: "₦2M+", label: "Revenue Facilitated" },
              { icon: Star, value: "4.8", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem", minWidth: 100 }}>
                <stat.icon size={18} style={{ color: "var(--glow-purple)" }} />
                <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{stat.value}</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section style={sectionStyle}>
          <p style={labelStyle}>How It Works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "2rem", textAlign: "center" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--glow-purple)" }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{s.title}</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 220 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={sectionStyle}>
          <p style={labelStyle}>Everything You Need</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {features.map((f) => (
              <div
                key={f.title}
                className="ambient-card"
                style={{ padding: "1.25rem 1.5rem", transition: "all 0.3s" }}
              >
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <f.icon size={18} style={{ color: "var(--glow-purple)" }} />
                </div>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.375rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section style={sectionStyle}>
          <p style={labelStyle}>Simple Pricing</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="ambient-card"
                style={{
                  padding: "1.5rem",
                  border: plan.popular ? "1px solid var(--glow-purple)" : "1px solid var(--border-subtle)",
                  position: "relative",
                }}
              >
                {plan.popular && (
                  <span style={{ position: "absolute", top: "-0.5rem", left: "50%", transform: "translateX(-50%)", fontSize: "0.625rem", fontWeight: 600, padding: "0.1875rem 0.75rem", borderRadius: 999, background: "var(--glow-purple)", color: "white", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    Most Popular
                  </span>
                )}
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>{plan.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{plan.price}</span>
                  {plan.period !== "Free" && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{plan.period}</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {plan.features.map((feat) => (
                    <li key={feat} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      <Check size={14} style={{ color: "var(--glow-green)", flexShrink: 0 }} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={plan.popular ? "glow-button" : "glow-button-secondary"}
                  style={{ display: "block", textAlign: "center", padding: "0.625rem", fontSize: "0.8125rem", width: "100%" }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section style={sectionStyle}>
          <p style={labelStyle}>What Vendors Say</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="ambient-card"
                style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "white" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t.name}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 560, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, borderRadius: 16, border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", padding: "3rem 2rem" }}>
            <p style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800 }}>Ready to Start Selling?</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 360 }}>
              Create your store in 60 seconds. Start with a free trial, upgrade when you&apos;re ready.
            </p>
            <div style={{ display: "flex", gap: 12, paddingTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="/auth/signup" className="glow-button" style={{ fontSize: 13, padding: "12px 28px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Create Your Store <ArrowRight size={14} />
              </Link>
              <Link href="/explore" className="glow-button-secondary" style={{ fontSize: 13, padding: "12px 28px" }}>Browse Stores</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: "2.5rem 1.5rem", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <div style={{ width: "1.25rem", height: "1.25rem", borderRadius: "0.25rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: "0.5rem" }}>S</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--text-primary)" }}>StallHq</span>
              </div>
              <p style={{ lineHeight: 1.5 }}>Digital storefronts for WhatsApp vendors<br />across Africa.</p>
            </div>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Product</p>
                <Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>Explore Stores</Link>
                <Link href="/auth/signup" style={{ color: "inherit", textDecoration: "none" }}>Create Store</Link>
                <Link href="/upgrade" style={{ color: "inherit", textDecoration: "none" }}>Pricing</Link>
                <Link href="/favorites" style={{ color: "inherit", textDecoration: "none" }}>My Favorites</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Account</p>
                <Link href="/auth/login" style={{ color: "inherit", textDecoration: "none" }}>Login</Link>
                <Link href="/auth/signup" style={{ color: "inherit", textDecoration: "none" }}>Sign Up</Link>
                <Link href="/auth/forgot-password" style={{ color: "inherit", textDecoration: "none" }}>Reset Password</Link>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 800, margin: "1.5rem auto 0", paddingTop: "1.5rem", borderTop: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} StallHq. Built for WhatsApp vendors across Africa.
          </div>
        </footer>
      </main>
    </>
  );
}
