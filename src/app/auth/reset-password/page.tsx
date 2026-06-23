"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle, MessageCircle, Eye, EyeOff } from "lucide-react";

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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <>
        <Particles />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Invalid reset link</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>This password reset link is invalid or has expired.</p>
            <Link href="/auth/forgot-password" className="glow-button" style={{ padding: "0.75rem 1.5rem", fontSize: "0.875rem" }}>
              Request a new link
            </Link>
          </div>
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <Particles />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: "1rem", height: "1rem", color: "white" }} />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700 }} className="text-gradient">stallHq</span>
          </Link>

          {/* Header */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Set new password</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Choose a strong password for your account
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
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.25rem" }}>Password updated</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Your password has been reset. You can now sign in.
                </p>
              </div>
              <button onClick={() => window.location.href = "/auth/login"} className="glow-button" style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem" }}>
                Sign In
              </button>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="ambient-input"
                    style={{ padding: "0.75rem 2.75rem 0.75rem 1rem", fontSize: "0.875rem", width: "100%" }}
                    placeholder="New password (min 6 characters)"
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
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="ambient-input"
                    style={{ padding: "0.75rem 2.75rem 0.75rem 1rem", fontSize: "0.875rem", width: "100%" }}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    Reset Password
                    <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <span style={{ width: "1.5rem", height: "1.5rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
