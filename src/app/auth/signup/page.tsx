"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Store, ShoppingCart, Eye, EyeOff } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";

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
  const [role, setRole] = useState<"choose" | "vendor" | "customer">("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { error: showError } = useAlert();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Create user via server-side API (admin API — no Supabase email)
    const signupRes = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!signupRes.ok) {
      const data = await signupRes.json();
      showError(data.error || "Failed to create account");
      setLoading(false);
      return;
    }

    // 2. Send custom verification code via Brevo
    await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "signup" }),
    });

    // 3. Redirect to verify-email page
    window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`;
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
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {role === "choose" ? "Join StallHq" : role === "vendor" ? "Create Vendor Account" : "Create Customer Account"}
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{ color: "var(--glow-purple)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>

          {/* Role Selection */}
          {role === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => setRole("vendor")}
                style={{
                  width: "100%", padding: "1.25rem", borderRadius: "0.75rem",
                  background: "rgba(168,133,247,0.06)", border: "1px solid rgba(168,133,247,0.2)",
                  cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "1rem",
                  minHeight: "44px", color: "var(--text-primary)",
                }}
              >
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(168,133,247,0.2), rgba(124,58,237,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Store size={18} style={{ color: "var(--glow-purple)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.125rem" }}>I want to sell</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Create a store, add products, reach customers</p>
                </div>
              </button>

              <button
                onClick={() => setRole("customer")}
                style={{
                  width: "100%", padding: "1.25rem", borderRadius: "0.75rem",
                  background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                  cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "1rem",
                  minHeight: "44px", color: "var(--text-primary)",
                }}
              >
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShoppingCart size={18} style={{ color: "var(--glow-green)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.125rem" }}>I want to shop</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Browse stores, place orders, track purchases</p>
                </div>
              </button>

              <Link href="/explore" style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", marginTop: "0.25rem" }}>
                or just browse stores without an account →
              </Link>
            </div>
          )}

          {/* Form - only show when role is selected */}
          {role !== "choose" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                className="ambient-input"
                style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                className="ambient-input"
                style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="ambient-input"
                  style={{ padding: "0.75rem 2.75rem 0.75rem 1rem", fontSize: "0.875rem", width: "100%" }}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                  {role === "vendor" ? "Create Vendor Account" : "Create Customer Account"}
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setRole("choose")}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", padding: "0.5rem", textAlign: "center" }}
            >
              ← Back to role selection
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
