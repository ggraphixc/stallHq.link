"use client";

import { useState } from "react";
import { Store, StoreHours } from "@/types";
import { X, Loader2 } from "lucide-react";
import { StoreHoursManager } from "./StoreHoursManager";

interface StoreSettingsProps {
  store: Store;
  onClose: () => void;
  onSaved: (store: Store) => void;
}

export function StoreSettings({ store, onClose, onSaved }: StoreSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsapp_number);
  const [email, setEmail] = useState(store.email || "");
  const [description, setDescription] = useState(store.description || "");
  const [storeHours, setStoreHours] = useState<StoreHours | null>(
    store.store_hours || null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          whatsapp_number: whatsappNumber,
          email: email || undefined,
          description: description || undefined,
          store_hours: storeHours,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update store");
      }

      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold">Store Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Store Name
            </label>
            <input
              type="text"
              className="ambient-input"
              placeholder="My Awesome Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Store URL</label>
            <div className="flex items-center gap-0">
              <span className="px-4 py-3 bg-[var(--bg-card)] border border-r-0 border-[var(--border-subtle)] rounded-l-lg text-[var(--text-muted)] text-sm hidden sm:inline">
                stallhq.link/
              </span>
              <span className="px-4 py-3 bg-[var(--bg-card)] border border-r-0 border-[var(--border-subtle)] rounded-l-lg text-[var(--text-muted)] text-sm sm:hidden">
                /
              </span>
              <input
                type="text"
                className="ambient-input !rounded-l-none"
                placeholder="my-store"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

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
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Email for Notifications <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              type="email"
              className="ambient-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-[var(--text-muted)]">
              Receive email alerts when orders are placed
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Description <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              className="ambient-input resize-none"
              rows={3}
              placeholder="What do you sell?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-4">
            <StoreHoursManager
              hours={storeHours}
              onChange={setStoreHours}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-button w-full disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
