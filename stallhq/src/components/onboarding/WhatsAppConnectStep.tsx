"use client";

import { useState } from "react";
import { Store } from "@/types";
import { MessageCircle, Loader2, ExternalLink } from "lucide-react";

interface WhatsAppConnectStepProps {
  store: Store;
  onConnected: () => void;
  onSkip: () => void;
}

export function WhatsAppConnectStep({
  store,
  onConnected,
  onSkip,
}: WhatsAppConnectStepProps) {
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(
    store.whatsapp_number
  );

  const handleFinish = async () => {
    setLoading(true);

    try {
      // Update store with WhatsApp number and mark setup as complete
      await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_number: whatsappNumber,
          setup_complete: true,
        }),
      });

      onConnected();
    } catch {
      // Still complete even if update fails
      onConnected();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);

    try {
      // Mark setup as complete even when skipping
      await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup_complete: true }),
      });

      onSkip();
    } catch {
      onSkip();
    } finally {
      setLoading(false);
    }
  };

  const formatWhatsAppUrl = (number: string) => {
    const cleaned = number.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect WhatsApp</h1>
        <p className="text-[var(--text-secondary)]">
          Customers will order directly through WhatsApp
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            WhatsApp Number
          </label>
          <input
            type="tel"
            className="ambient-input"
            placeholder="+234 800 000 0000"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Include country code. This is where customers will send orders.
          </p>
        </div>

        {/* Preview */}
        {whatsappNumber && (
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-muted)] mb-2">Preview</p>
            <a
              href={formatWhatsAppUrl(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat on WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* How it works */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <p className="text-sm font-medium">How it works</p>
          <ol className="text-sm text-[var(--text-secondary)] space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[var(--glow-purple)] font-bold">1.</span>
              Customer browses your store and adds items to cart
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--glow-purple)] font-bold">2.</span>
              They tap &quot;Order via WhatsApp&quot; to send you a pre-filled
              message
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--glow-purple)] font-bold">3.</span>
              You receive the order and confirm via WhatsApp
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="flex-1 glow-button disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Complete Setup"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
