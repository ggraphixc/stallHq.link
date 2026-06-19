"use client";

import { useState } from "react";
import { Store } from "@/types";
import { Store as StoreIcon, Loader2 } from "lucide-react";

interface StoreDetailsStepProps {
  existingStore: Store | null;
  onStoreCreated: (store: Store) => void;
}

const STORE_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Food & Drinks",
  "Health & Beauty",
  "Home & Garden",
  "Sports",
  "Books",
  "Art & Crafts",
  "Services",
  "Other",
];

export function StoreDetailsStep({
  existingStore,
  onStoreCreated,
}: StoreDetailsStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(existingStore?.name || "");
  const [slug, setSlug] = useState(existingStore?.slug || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    existingStore?.whatsapp_number || ""
  );
  const [email, setEmail] = useState(existingStore?.email || "");
  const [description, setDescription] = useState(
    existingStore?.description || ""
  );
  const [category, setCategory] = useState(existingStore?.category || "");

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const method = existingStore ? "PATCH" : "POST";
      const res = await fetch("/api/stores", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          whatsapp_number: whatsappNumber,
          email: email || undefined,
          description: description || undefined,
          category: category || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save store");
      }

      onStoreCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
          <StoreIcon className="w-8 h-8 text-[var(--glow-purple)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Create Your Store</h1>
        <p className="text-[var(--text-secondary)]">
          Set up your digital storefront in seconds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Store Name</label>
          <input
            type="text"
            className="ambient-input"
            placeholder="My Awesome Store"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(generateSlug(e.target.value));
            }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Store URL</label>
          <div className="flex items-center gap-0">
            <span className="px-3 py-3 bg-[var(--bg-card)] border border-r-0 border-[var(--border-subtle)] rounded-l-lg text-[var(--text-muted)] text-sm whitespace-nowrap">
              stallhq.link/
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
            required
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Customers will chat with you on this number
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email for Notifications (optional)
          </label>
          <input
            type="email"
            className="ambient-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Get email alerts when customers place orders
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            className="ambient-input resize-none"
            rows={3}
            placeholder="What do you sell?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Store Category
          </label>
          <select
            className="ambient-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="glow-button w-full disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </div>
  );
}
