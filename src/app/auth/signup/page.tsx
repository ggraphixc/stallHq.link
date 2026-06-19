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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.5 }} />;
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
      <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--glow-green)] to-[var(--glow-cyan)] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gradient">stallHq</span>
          </Link>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold">Create account</h1>
            <p className="text-xs text-[var(--text-muted)]">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[var(--glow-purple)] hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--glow-red)]/10 border border-[var(--glow-red)]/20 text-[var(--glow-red)] text-xs">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] backdrop-blur-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--glow-green)]/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-5 h-5 text-[var(--glow-green)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">Check your email</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Confirmation link sent to <span className="font-medium">{email}</span>
                </p>
              </div>
              <button onClick={() => window.location.href = "/auth/login"} className="glow-button w-full !py-3 text-sm">
                Go to Sign In
              </button>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-3">
                <input
                  type="email"
                  className="ambient-input !py-3 !text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="ambient-input !py-3 !text-sm"
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
                className="glow-button w-full !py-3 text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-[10px] text-[var(--text-muted)]">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
