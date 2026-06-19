"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Mail, ArrowRight, MessageCircle } from "lucide-react";

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

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
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

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.5 }} />;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true);
    }
    setMagicLoading(false);
  };

  return (
    <>
      <Particles />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: "1rem", height: "1rem", color: "white" }} />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700 }} className="text-gradient">stallHq</span>
          </Link>

          {/* Header */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" style={{ color: "var(--glow-purple)", textDecoration: "none", fontWeight: 500 }}>Create one</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--glow-red)", fontSize: "0.75rem" }}>
              {error}
            </div>
          )}

          {/* Magic Link Success */}
          {magicSent && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "var(--glow-green)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Mail style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
              Check your email for the magic link!
            </div>
          )}

          {/* Email + Password */}
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="email"
                className="ambient-input"
                style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="ambient-input"
                style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="glow-button"
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem" }}
            >
              {loading ? (
                <span style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  Sign In
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>

          {/* Magic Link */}
          <form onSubmit={handleMagicLink}>
            <button
              type="submit"
              disabled={magicLoading}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {magicLoading ? (
                <span style={{ width: "1rem", height: "1rem", border: "2px solid rgba(var(--text-muted),0.3)", borderTopColor: "var(--text-muted)", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
              ) : (
                <>
                  <Mail style={{ width: "1rem", height: "1rem" }} />
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.625rem", color: "var(--text-muted)" }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
