"use client";

import { Store } from "@/types";
import { CheckCircle, ExternalLink, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";

interface OnboardingCompleteProps {
  store: Store | null;
}

export function OnboardingComplete({ store }: OnboardingCompleteProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Celebration orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[var(--glow-green)]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[var(--glow-purple)]/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
      </div>

      <div className="max-w-lg w-full text-center space-y-10 relative z-10">
        {/* Success icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--glow-green)]/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[var(--glow-green)]/20 to-[var(--glow-green)]/5 border-2 border-[var(--glow-green)]/30 flex items-center justify-center mx-auto animate-fade-in">
            <CheckCircle className="w-12 h-12 text-[var(--glow-green)]" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--glow-amber)]" />
            <span className="text-sm font-medium text-[var(--glow-amber)] uppercase tracking-wider">Congratulations</span>
            <Sparkles className="w-5 h-5 text-[var(--glow-amber)]" />
          </div>
          <h1 className="text-4xl font-extrabold text-gradient">You&apos;re all set!</h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Your store is live and ready to accept orders
          </p>
        </div>

        {/* Store Card */}
        {store && (
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3 font-medium">Your store address</p>
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xl font-bold text-gradient hover:opacity-80 transition-opacity"
            >
              stallhq.link/{store.slug}
              <ExternalLink className="w-5 h-5 text-[var(--glow-purple)]" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <a
            href="/dashboard"
            className="glow-button w-full !py-4 text-base group flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          {store && (
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--glow-purple)]/50 hover:bg-[var(--bg-card)] transition-all text-center font-medium"
            >
              View Your Store
            </a>
          )}
        </div>

        {/* Tips */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] text-left animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p className="text-sm font-semibold mb-4">Quick tips to get started:</p>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {[
              "Add product images to attract more customers",
              "Share your store link on social media",
              "Keep your product catalog up to date",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--glow-purple)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[var(--glow-purple)]">{i + 1}</span>
                </div>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
