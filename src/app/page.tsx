"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

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
  { icon: "$", title: "Zero Cost", desc: "No fees. Ever." },
  { icon: "📱", title: "Mobile First", desc: "Built for African smartphones." },
  { icon: "💬", title: "WhatsApp Orders", desc: "Orders straight to your chat." },
  { icon: "🔗", title: "QR Code Ready", desc: "Print, share, get orders." },
  { icon: "📊", title: "Order Tracking", desc: "Pending to delivered." },
  { icon: "⚡", title: "Instant Setup", desc: "Live in 60 seconds." },
];

const steps = [
  { n: "01", title: "Create Store", desc: "Pick a name, add WhatsApp." },
  { n: "02", title: "Add Products", desc: "Upload photos, set prices." },
  { n: "03", title: "Share & Sell", desc: "Share link. Get orders." },
];

const sectionStyle: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "5rem 1.5rem" };
const labelStyle: React.CSSProperties = { textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "2.5rem" };

export default function Home() {
  return (
    <>
      <Particles />
      <main className="relative z-10">
        {/* Hero */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "85vh", padding: "0 1.5rem", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "var(--glow-purple)", borderRadius: "50%", opacity: 0.04, filter: "blur(140px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 10, maxWidth: 640, display: "flex", flexDirection: "column", gap: "1.25rem" }} className="fade-in">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "var(--text-secondary)", alignSelf: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--glow-green)", animation: "pulse 2s infinite" }} />
              Free forever
            </div>
            <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Your WhatsApp.<br />
              <span className="text-gradient">Your Store.</span>
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
              Digital storefront for WhatsApp vendors. Zero cost, instant setup.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 8, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="glow-button" style={{ fontSize: 13, padding: "10px 24px" }}>
                Open Dashboard
              </Link>
              <Link href="/demo-store" className="glow-button-secondary" style={{ fontSize: 13, padding: "10px 24px" }}>
                View Demo
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, paddingTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
              <span>Zero hosting</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-medium)", alignSelf: "center" }} />
              <span>60s setup</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-medium)", alignSelf: "center" }} />
              <span>WhatsApp native</span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section style={sectionStyle}>
          <p style={labelStyle}>How It Works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", textAlign: "center" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.06)" }}>{s.n}</span>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={sectionStyle}>
          <p style={labelStyle}>Features</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {features.map((f) => (
              <div
                key={f.title}
                style={{ borderRadius: 12, border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", padding: "1rem 1.25rem", transition: "all 0.3s" }}
              >
                <div style={{ fontSize: 18, marginBottom: 8 }}>{f.icon}</div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 520, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, borderRadius: 16, border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", padding: "3rem 2rem" }}>
            <p style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800 }}>100% Free</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No catches. Start selling in 60 seconds.</p>
            <div style={{ display: "flex", gap: 12, paddingTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="/dashboard" className="glow-button" style={{ fontSize: 13, padding: "10px 24px" }}>Start Selling Now</Link>
              <Link href="/explore" className="glow-button-secondary" style={{ fontSize: 13, padding: "10px 24px" }}>Browse Stores</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: "2rem 1.5rem", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap", gap: 12 }}>
            <span>StallHq &mdash; Built for WhatsApp vendors across Africa.</span>
            <div style={{ display: "flex", gap: 16 }}>
              <Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>Explore</Link>
              <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
