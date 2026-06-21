"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  storeId: string;
  onReviewSubmitted?: () => void;
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
  resize: "none",
};

export function ReviewForm({ productId, storeId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reviewerName.trim()) { setError("Please enter your name"); return; }
    if (rating === 0) { setError("Please select a rating"); return; }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId, store_id: storeId,
          reviewer_name: reviewerName.trim(), rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }
      setSubmitted(true);
      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ ...glassCard, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
          <Star size={24} style={{ color: "var(--glow-green)" }} fill="currentColor" />
        </div>
        <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.25rem" }}>Thanks for your review!</h4>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Your feedback helps other customers.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...glassCard, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h4 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Write a Review</h4>

      {/* Rating Stars */}
      <div>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Rating</label>
        <div style={{ display: "flex", gap: "0.125rem" }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", transform: "scale(1)", transition: "transform 0.15s" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Star
                size={28}
                style={{ color: value <= (hoveredRating || rating) ? "var(--glow-amber)" : "var(--text-muted)", transition: "color 0.15s" }}
                fill={value <= (hoveredRating || rating) ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>Your Name</label>
        <input
          type="text"
          style={inputStyle}
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Enter your name"
          maxLength={100}
        />
      </div>

      {/* Comment */}
      <div>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
          Comment <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: "5rem" }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={3}
          maxLength={1000}
        />
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "right", marginTop: "0.25rem" }}>{comment.length}/1000</p>
      </div>

      {error && <p style={{ fontSize: "0.8125rem", color: "var(--glow-red)" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting || rating === 0 || !reviewerName.trim()}
        className="glow-button"
        style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        {submitting ? (
          <>
            <span style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            Submitting...
          </>
        ) : (
          <>
            <Send size={16} />
            Submit Review
          </>
        )}
      </button>
    </form>
  );
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
};
