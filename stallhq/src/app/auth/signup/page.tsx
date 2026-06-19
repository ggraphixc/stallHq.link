"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowRight, CheckCircle, MessageCircle } from "lucide-react";

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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--glow-green)]/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-[var(--glow-purple)]/6 rounded-full blur-3xl animate-float" style={{ animationDelay: "-4s" }} />
      </div>

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 xl:p-20">
        <div className="max-w-lg space-y-10">
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--glow-green)] to-[var(--glow-cyan)] flex items-center justify-center shadow-lg shadow-[var(--glow-green)]/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-extrabold text-gradient">stallHq</span>
            </div>
          </Link>

          <div className="space-y-5">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Start selling on{" "}
              <span className="text-gradient">WhatsApp</span> in minutes
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Create your digital storefront and reach customers instantly
            </p>
          </div>

          <div className="space-y-5">
            {[
              "Free to set up, no hidden fees",
              "Accept orders via WhatsApp",
              "Track everything from one dashboard",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--glow-green)]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-[var(--glow-green)]" />
                </div>
                <span className="text-[var(--text-secondary)] text-lg">{feature}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="pt-8 border-t border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-muted)] italic leading-relaxed">
              &ldquo;Set up my store in 5 minutes. Now I get orders directly on WhatsApp!&rdquo;
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-3 font-medium">
              — Happy Vendor
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-12 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-block">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--glow-green)] to-[var(--glow-cyan)] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-extrabold text-gradient">stallHq</span>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold">Create your account</h2>
            <p className="text-[var(--text-secondary)]">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[var(--glow-purple)] hover:text-[var(--glow-purple)]/80 font-medium transition-colors"
              >
                Sign in
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

          {/* Success */}
          {success && (
            <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--glow-green)]/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-[var(--glow-green)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Check your email</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  We sent a confirmation link to <span className="font-medium">{email}</span>
                </p>
              </div>
              <button
                onClick={() => window.location.href = "/auth/login"}
                className="glow-button w-full !py-3"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {/* Signup Form */}
          {!success && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
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
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glow-button w-full !py-4 text-base group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Help text */}
          <p className="text-center text-xs text-[var(--text-muted)]">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
