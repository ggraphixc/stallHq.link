"use client";

import { useState } from "react";
import { Store } from "@/types";
import { Store as StoreIcon, Loader2, ArrowRight, Link as LinkIcon, MessageCircle } from "lucide-react";

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.375rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "var(--text-muted)",
  marginTop: "0.25rem",
};

export function StoreDetailsStep({ existingStore, onStoreCreated }: StoreDetailsStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(existingStore?.name || "");
  const [slug, setSlug] = useState(existingStore?.slug || "");
  const [whatsappNumber, setWhatsappNumber] = useState(existingStore?.whatsapp_number || "");
  const [email, setEmail] = useState(existingStore?.email || "");
  const [description, setDescription] = useState(existingStore?.description || "");
  const [category, setCategory] = useState(existingStore?.category || "");

  const generateSlug = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
      if (!res.ok) throw new Error(data.error || "Failed to save store");
      onStoreCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
          <StoreIcon size={20} style={{ color: "var(--glow-purple)" }} />
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Create Your Store</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Set up your digital storefront in seconds</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Error */}
        {error && (
          <div style={{ padding: "0.625rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--glow-red)", fontSize: "0.75rem" }}>
            {error}
          </div>
        )}

        {/* Store Name */}
        <div>
          <label style={labelStyle}>Store Name</label>
          <input
            type="text"
            className="ambient-input"
            style={inputStyle}
            placeholder="My Awesome Store"
            value={name}
            onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }}
            required
          />
        </div>

        {/* Store URL */}
        <div>
          <label style={labelStyle}>Store URL</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ padding: "0.625rem 0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRight: "none", borderRadius: "0.5rem 0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <LinkIcon size={12} />
              <span>stallhq.link/</span>
            </span>
            <input
              type="text"
              className="ambient-input"
              style={{ ...inputStyle, borderRadius: "0 0.5rem 0.5rem 0" }}
              placeholder="my-store"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label style={labelStyle}>WhatsApp Number</label>
          <input
            type="tel"
            className="ambient-input"
            style={inputStyle}
            placeholder="+234 800 000 0000"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            required
          />
          <p style={hintStyle}>Customers will chat with you on this number</p>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
          <input
            type="email"
            className="ambient-input"
            style={inputStyle}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p style={hintStyle}>Get email alerts when customers place orders</p>
        </div>

        {/* Two columns: Category + Description */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              className="ambient-input"
              style={{ ...inputStyle, cursor: "pointer" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select</option>
              {STORE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <input
              type="text"
              className="ambient-input"
              style={inputStyle}
              placeholder="What do you sell?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="glow-button"
          style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", marginTop: "0.25rem" }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Saving...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              Continue
              <ArrowRight size={16} />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
