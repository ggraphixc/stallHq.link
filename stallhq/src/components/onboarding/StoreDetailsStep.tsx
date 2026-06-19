"use client";

import { useState } from "react";
import { Store } from "@/types";
import { Store as StoreIcon, Loader2, ArrowRight, Link as LinkIcon, MessageSquare, Mail, Tag } from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--glow-purple)]/20 to-[var(--glow-cyan)]/20 border border-[var(--border-subtle)] flex items-center justify-center mx-auto">
          <StoreIcon className="w-8 h-8 text-[var(--glow-purple)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Create Your Store</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Set up your digital storefront in seconds
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--glow-red)]/10 border border-[var(--glow-red)]/20 text-[var(--glow-red)] text-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--glow-red)]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        {/* Store Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Store Name
          </label>
          <div className="relative">
            <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
              placeholder="My Awesome Store"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(generateSlug(e.target.value));
              }}
              required
            />
          </div>
        </div>

        {/* Store URL */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Store URL
          </label>
          <div className="flex items-center">
            <span className="flex items-center gap-2 px-4 py-4 bg-[var(--bg-card)] border border-r-0 border-[var(--border-subtle)] rounded-l-xl text-[var(--text-muted)] text-sm whitespace-nowrap">
              <LinkIcon className="w-4 h-4" />
              stallhq.link/
            </span>
            <input
              type="text"
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-r-xl px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
              placeholder="my-store"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
        </div>

        {/* WhatsApp Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            WhatsApp Number
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="tel"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
              placeholder="+234 800 000 0000"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Customers will chat with you on this number
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Email for Notifications <span className="text-[var(--text-muted)]">(optional)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="email"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Get email alerts when customers place orders
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Description <span className="text-[var(--text-muted)]">(optional)</span>
          </label>
          <textarea
            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all resize-none"
            rows={3}
            placeholder="What do you sell?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Store Category
          </label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--glow-purple)] focus:ring-1 focus:ring-[var(--glow-purple)]/50 transition-all appearance-none"
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
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="glow-button w-full !py-4 text-base group"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
