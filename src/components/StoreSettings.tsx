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

export function StoreSettings({ store, onClose, onSaved }: StoreSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsapp_number);
  const [email, setEmail] = useState(store.email || "");
  const [description, setDescription] = useState(store.description || "");
  const [storeHours, setStoreHours] = useState<StoreHours | null>(store.store_hours || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug,
          whatsapp_number: whatsappNumber,
          email: email || undefined,
          description: description || undefined,
          store_hours: storeHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update store");
      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "32rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Store Settings</h2>
          <button onClick={onClose} style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div style={{ padding: "0.625rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--glow-red)", fontSize: "0.75rem" }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Store Name</label>
            <input type="text" className="ambient-input" style={inputStyle} placeholder="My Awesome Store" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>Store URL</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ padding: "0.625rem 0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRight: "none", borderRadius: "0.5rem 0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                stallhq.link/
              </span>
              <input type="text" className="ambient-input" style={{ ...inputStyle, borderRadius: "0 0.5rem 0.5rem 0" }} placeholder="my-store" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>WhatsApp Number</label>
            <input type="tel" className="ambient-input" style={inputStyle} placeholder="+234 800 000 0000" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} required />
            <p style={hintStyle}>Customers will chat with you on this number</p>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <input type="email" className="ambient-input" style={inputStyle} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p style={hintStyle}>Receive email alerts when orders are placed</p>
          </div>

          <div>
            <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <textarea className="ambient-input" style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="What do you sell?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
            <StoreHoursManager hours={storeHours} onChange={setStoreHours} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-button"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Saving...
              </span>
            ) : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
