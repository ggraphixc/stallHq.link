"use client";

import { useState } from "react";
import { Store } from "@/types";
import { MessageCircle, Loader2, ExternalLink, ArrowRight, Check } from "lucide-react";

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
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--glow-green)]/20 to-[var(--glow-green)]/10 border border-[var(--border-subtle)] flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-[var(--glow-green)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Connect WhatsApp</h1>
          <p className="text-[var(--text-secondary)] mt-3">
            Customers will order directly through WhatsApp
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Number Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            WhatsApp Number
          </label>
          <input
            type="tel"
            className="ambient-input"
            placeholder="+234 800 000 0000"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <p className="text-xs text-[var(--text-muted)]">
            Include country code. This is where customers will send orders.
          </p>
        </div>

        {/* Preview */}
        {whatsappNumber && (
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--glow-green)]/30 transition-colors">
            <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider font-medium">Preview</p>
            <a
              href={formatWhatsAppUrl(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-[var(--glow-green)] hover:text-[var(--glow-green)]/80 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--glow-green)]/10 flex items-center justify-center group-hover:bg-[var(--glow-green)]/20 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium block">Chat on WhatsApp</span>
                <span className="text-xs text-[var(--text-muted)]">Test your WhatsApp link</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        )}

        {/* How it works */}
        <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-sm font-semibold mb-5">How it works</p>
          <ol className="space-y-5">
            {[
              {
                step: "1",
                title: "Customer browses",
                desc: "They browse your store and add items to cart",
              },
              {
                step: "2",
                title: "They order",
                desc: 'They tap "Order via WhatsApp" to send you a pre-filled message',
              },
              {
                step: "3",
                title: "You confirm",
                desc: "You receive the order and confirm via WhatsApp",
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--glow-purple)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[var(--glow-purple)]">{item.step}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 py-4 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all font-medium disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="flex-1 glow-button !py-4 group"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Finishing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Complete Setup
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
