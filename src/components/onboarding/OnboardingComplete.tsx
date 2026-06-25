"use client";

import { useRef, useEffect } from "react";
import { Store } from "@/types";
import { CheckCircle, ExternalLink, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";

interface OnboardingCompleteProps {
  store: Store | null;
}

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

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.25 + 0.05,
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
        ctx!.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
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

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />;
}

export function OnboardingComplete({ store }: OnboardingCompleteProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative", overflow: "hidden" }}>
      <Particles />

      <div style={{ maxWidth: "24rem", width: "100%", textAlign: "center", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Success icon */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.15)", filter: "blur(40px)", borderRadius: "50%" }} />
          <div style={{ position: "relative", width: "4rem", height: "4rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", border: "2px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <CheckCircle size={32} style={{ color: "var(--glow-green)" }} />
          </div>
        </div>

        {/* Title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
            <Sparkles size={14} style={{ color: "var(--glow-amber)" }} />
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--glow-amber)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Congratulations</span>
            <Sparkles size={14} style={{ color: "var(--glow-amber)" }} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.375rem" }} className="text-gradient">You&apos;re all set!</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Your store is live and ready to accept orders</p>
        </div>

        {/* Store Card */}
        {store && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", padding: "1rem" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem", fontWeight: 600 }}>Your store address</p>
            <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }} className="text-gradient">
              stallhq.link/{store.slug}
              <ExternalLink size={16} style={{ color: "var(--glow-purple)" }} />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <a href="/dashboard" className="glow-button" style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none" }}>
            <LayoutDashboard size={16} />
            Go to Dashboard
            <ArrowRight size={16} />
          </a>
          {store && (
            <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontSize: "0.8125rem", textAlign: "center", fontWeight: 500, textDecoration: "none", display: "block" }}>
              View Your Store
            </a>
          )}
        </div>

        {/* Tips */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", padding: "1rem", textAlign: "left" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.625rem" }}>What to do next:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              "Add product photos — stores with images get 3x more orders",
              "Share your store link on WhatsApp status, Instagram bio, and TikTok",
              "Tell 5 friends about your store today — word of mouth is powerful",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "rgba(168,133,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.0625rem" }}>
                  <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "var(--glow-purple)" }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
