"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowRight, CheckCircle, MessageCircle } from "lucide-react";

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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <>
      <Particles />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-green), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: "1rem", height: "1rem", color: "white" }} />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700 }} className="text-gradient">stallHq</span>
          </Link>

          {/* Header */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Create account</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{ color: "var(--glow-purple)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--glow-red)", fontSize: "0.75rem" }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                <CheckCircle style={{ width: "1.25rem", height: "1.25rem", color: "var(--glow-green)" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.25rem" }}>Check your email</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Confirmation link sent to <span style={{ fontWeight: 500 }}>{email}</span>
                </p>
              </div>
              <button onClick={() => window.location.href = "/auth/login"} className="glow-button" style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem" }}>
                Go to Sign In
              </button>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                    Create Account
                    <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                  </span>
                )}
              </button>
            </form>
          )}

          <p style={{ textAlign: "center", fontSize: "0.625rem", color: "var(--text-muted)" }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
