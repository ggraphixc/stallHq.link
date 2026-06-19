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

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

const features = [
  { icon: "$", title: "Zero Cost", desc: "No fees. Ever.", accent: "green" as const },
  { icon: "📱", title: "Mobile First", desc: "Built for African smartphones.", accent: "purple" as const },
  { icon: "💬", title: "WhatsApp Orders", desc: "Orders straight to your chat.", accent: "cyan" as const },
  { icon: "🔗", title: "QR Code Ready", desc: "Print, share, get orders.", accent: "amber" as const },
  { icon: "📊", title: "Order Tracking", desc: "Pending to delivered.", accent: "purple" as const },
  { icon: "⚡", title: "Instant Setup", desc: "Live in 60 seconds.", accent: "green" as const },
];

const steps = [
  { n: "01", title: "Create Store", desc: "Pick a name, add WhatsApp." },
  { n: "02", title: "Add Products", desc: "Upload photos, set prices." },
  { n: "03", title: "Share & Sell", desc: "Share link. Get orders." },
];

const accentMap = {
  green: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)", color: "#10b981" },
  purple: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.2)", color: "#a855f7" },
  cyan: { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.2)", color: "#06b6d4" },
  amber: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)", color: "#f59e0b" },
};

export default function Home() {
  return (
    <>
      <Particles />
      <main className="relative z-10 min-h-screen">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--glow-purple)] rounded-full opacity-[0.04] blur-[140px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6 fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] backdrop-blur-sm text-xs text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--glow-green)] animate-pulse" />
              Free forever
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Your WhatsApp.
              <br />
              <span className="text-gradient">Your Store.</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              Digital storefront for WhatsApp vendors. Zero cost, instant setup.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard" className="glow-button text-sm px-6 py-3">
                Open Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <Link href="/demo-store" className="glow-button-secondary text-sm px-6 py-3">
                View Demo
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[var(--text-muted)]">
              <span>Zero hosting</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-medium)]" />
              <span>60s setup</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-medium)]" />
              <span>WhatsApp native</span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-8">How It Works</p>
            <div className="grid grid-cols-3 gap-4">
              {steps.map((s) => (
                <div key={s.n} className="text-center space-y-2 p-4">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white/[0.06]">{s.n}</span>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-8">Features</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {features.map((f) => {
                const a = accentMap[f.accent];
                return (
                  <div
                    key={f.title}
                    className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] backdrop-blur-sm p-4 sm:p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                  >
                    <div className="text-lg mb-2">{f.icon}</div>
                    <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 sm:py-20">
          <div className="max-w-xl mx-auto text-center space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] backdrop-blur-sm p-8 sm:p-12">
            <p className="text-3xl sm:text-4xl font-extrabold">100% Free</p>
            <p className="text-sm text-[var(--text-secondary)]">No catches. Start selling in 60 seconds.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard" className="glow-button px-6 py-3 text-sm">Start Selling Now</Link>
              <Link href="/explore" className="glow-button-secondary px-6 py-3 text-sm">Browse Stores</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-[var(--border-subtle)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>StallHq &mdash; Built for WhatsApp vendors across Africa.</span>
            <div className="flex items-center gap-4">
              <Link href="/explore" className="hover:text-[var(--text-primary)] transition-colors">Explore</Link>
              <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Dashboard</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
