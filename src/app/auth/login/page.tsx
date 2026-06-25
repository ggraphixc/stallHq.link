"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mail, ArrowRight, MessageCircle, Eye, EyeOff } from "lucide-react";
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { error: showError } = useAlert();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === "email_not_confirmed") {
        await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "signup" }),
        });
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`;
        return;
      }
      showError(data.error || "Login failed");
      setLoading(false);
      return;
    }

    // Cookies are set on the JSON response — now check if user has a store
    const storeCheck = await fetch("/api/stores");
    const storeData = await storeCheck.json();
    
    // Check if user is admin
    if (email.toLowerCase() === "zerupth@gmail.com") {
      window.location.href = "/admin";
      return;
    }
    
    if (storeData.store) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/dashboard/customer";
    }
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
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="ambient-input"
                  style={{ padding: "0.75rem 5.5rem 0.75rem 1rem", fontSize: "0.875rem", width: "100%" }}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div style={{ position: "absolute", right: "0.375rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "0.125rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <Link
                    href="/auth/forgot-password"
                    style={{ fontSize: "0.6875rem", color: "var(--glow-purple)", textDecoration: "none", padding: "0.375rem 0.375rem 0.375rem 0", whiteSpace: "nowrap" }}
                  >
                    Forgot?
                  </Link>
                </div>
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
                  Sign In
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </span>
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
