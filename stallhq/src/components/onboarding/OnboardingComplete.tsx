"use client";

import { Store } from "@/types";
import { CheckCircle, ExternalLink, ArrowRight } from "lucide-react";

interface OnboardingCompleteProps {
  store: Store | null;
}

export function OnboardingComplete({ store }: OnboardingCompleteProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success animation */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[var(--glow-green)]/20 flex items-center justify-center mx-auto animate-pulse-glow">
            <CheckCircle className="w-10 h-10 text-[var(--glow-green)]" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">You&apos;re all set!</h1>
          <p className="text-[var(--text-secondary)]">
            Your store is live and ready to accept orders
          </p>
        </div>

        {store && (
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-muted)] mb-1">Your store</p>
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[var(--glow-purple)] hover:text-[var(--glow-purple)]/80 font-medium transition-colors"
            >
              stallhq.link/{store.slug}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <a
            href="/dashboard"
            className="glow-button w-full flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </a>
          {store && (
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors text-center"
            >
              View Your Store
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
