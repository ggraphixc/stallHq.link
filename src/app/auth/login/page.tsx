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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.5 }} />;
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
      <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--glow-purple)] to-[var(--glow-cyan)] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gradient">stallHq</span>
          </Link>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="text-xs text-[var(--text-muted)]">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-[var(--glow-purple)] hover:underline font-medium">Create one</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--glow-red)]/10 border border-[var(--glow-red)]/20 text-[var(--glow-red)] text-xs">
              {error}
            </div>
          )}

          {/* Magic Link Success */}
          {magicSent && (
            <div className="p-3 rounded-lg bg-[var(--glow-green)]/10 border border-[var(--glow-green)]/20 text-[var(--glow-green)] text-xs flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              Check your email for the magic link!
            </div>
          )}

          {/* Email + Password */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-xs text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Magic Link */}
          <form onSubmit={handleMagicLink}>
            <button
              type="submit"
              disabled={magicLoading}
              className="w-full py-3 rounded-lg border border-[var(--border-subtle)] bg-white/[0.02] hover:bg-white/[0.04] text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {magicLoading ? (
                <span className="w-4 h-4 border-2 border-[var(--text-muted)]/30 border-t-[var(--text-muted)] rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-[var(--text-muted)]">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
