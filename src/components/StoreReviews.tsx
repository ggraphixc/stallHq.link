"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { Review } from "@/types";

interface StoreReviewsProps {
  storeId: string;
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  resize: "none",
};

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.125rem" }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(v)}
          onMouseEnter={() => setHover(v)}
          onMouseLeave={() => setHover(0)}
          style={{
            padding: "0.125rem", background: "none", border: "none",
            cursor: onChange ? "pointer" : "default",
          }}
        >
          <Star
            size={onChange ? 20 : 14}
            style={{ color: v <= (hover || value) ? "var(--glow-amber)" : "var(--text-muted)" }}
            fill={v <= (hover || value) ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export function StoreReviews({ storeId }: StoreReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?store_id=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || { count: 0, average: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!rating) { setError("Please choose a rating"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          reviewer_name: name.trim(),
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setName(""); setRating(0); setComment(""); setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageSquare size={16} style={{ color: "var(--glow-purple)" }} />
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
            Store Reviews
            {summary.count > 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.5rem" }}>
                {summary.count} · {summary.average} ★
              </span>
            )}
          </h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="glow-button"
            style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <Send size={12} /> Write a review
          </button>
        )}
      </div>

      {/* Write form */}
      {showForm && (
        <form onSubmit={submit} style={{ ...glassCard, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Your rating</label>
              <Stars value={rating} onChange={setRating} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>Your name</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={100} />
            </div>
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: "4.5rem" }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was your experience with this store?"
            maxLength={1000}
          />
          {error && <p style={{ fontSize: "0.75rem", color: "var(--glow-red)" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={submitting} className="glow-button" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem" }}>
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div style={{ ...glassCard, padding: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            No reviews yet — be the first to share your experience with this store.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ ...glassCard, padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                <div style={{
                  width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(168,133,247,0.2), rgba(6,182,212,0.15))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.625rem", fontWeight: 700, color: "var(--glow-purple)",
                  flexShrink: 0,
                }}>
                  {r.reviewer_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{r.reviewer_name}</p>
                  <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                    {new Date(r.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div style={{ marginLeft: "auto" }}><Stars value={r.rating} /></div>
              </div>
              {r.comment && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
