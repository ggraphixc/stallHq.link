"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Mail, ArrowRight, Sparkles, MessageCircle } from "lucide-react";

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true);
    }
    setMagicLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--glow-purple)]/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--glow-cyan)]/6 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 xl:p-20">
        <div className="max-w-lg space-y-10">
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--glow-purple)] to-[var(--glow-cyan)] flex items-center justify-center shadow-lg shadow-[var(--glow-purple)]/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-extrabold text-gradient">stallHq</span>
            </div>
          </Link>

          <div className="space-y-5">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Welcome back to your{" "}
              <span className="text-gradient">digital storefront</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Manage your WhatsApp business from one powerful dashboard
            </p>
          </div>

          <div className="space-y-5">
            {[
              "Track orders in real-time",
              "Manage products effortlessly",
              "Connect with customers instantly",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--glow-green)]/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--glow-green)]" />
                </div>
                <span className="text-[var(--text-secondary)] text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12 relative">
        <div className="w-full max-w-md space-y-10 mx-auto">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-block">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--glow-purple)] to-[var(--glow-cyan)] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-extrabold text-gradient">stallHq</span>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold">Sign in to your account</h2>
            <p className="text-[var(--text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-[var(--glow-purple)] hover:text-[var(--glow-purple)]/80 font-medium transition-colors"
              >
                Create one for free
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-[var(--glow-red)]/10 border border-[var(--glow-red)]/20 text-[var(--glow-red)] text-sm flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--glow-red)]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Magic Link Success */}
          {magicSent && (
            <div className="p-4 rounded-xl bg-[var(--glow-green)]/10 border border-[var(--glow-green)]/20 text-[var(--glow-green)] text-sm flex items-center gap-3">
              <Mail className="w-5 h-5 flex-shrink-0" />
              Check your email for the magic link!
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Email address
                </label>
                <input
                  type="email"
                  className="ambient-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <input
                  type="password"
                  className="ambient-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <br />
            <button
              type="submit"
              disabled={loading}
              className="glow-button w-full !py-4 text-base group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
              <br />
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--bg-primary)] text-[var(--text-muted)]">
                or continue with
              </span>
            </div>
          </div>
              <br />
          {/* Magic Link */}
          <form onSubmit={handleMagicLink}>
            <button
              type="submit"
              disabled={magicLoading}
              className="w-full py-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {magicLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-[var(--text-muted)]/30 border-t-[var(--text-muted)] rounded-full animate-spin" />
                  Sending link...
                </span>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          {/* Help text */}
          <p className="text-center text-xs text-[var(--text-muted)]">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
