"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  storeId: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  productId,
  storeId,
  onReviewSubmitted,
}: ReviewFormProps) {
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

    if (!reviewerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          store_id: storeId,
          reviewer_name: reviewerName.trim(),
          rating,
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
      <div className="ambient-card p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--glow-green)]/20 flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-[var(--glow-green)]" fill="currentColor" />
        </div>
        <h4 className="font-semibold mb-1">Thanks for your review!</h4>
        <p className="text-sm text-[var(--text-muted)]">
          Your feedback helps other customers.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ambient-card p-6 space-y-6">
      <h4 className="font-semibold">Write a Review</h4>

      {/* Rating Stars */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  value <= (hoveredRating || rating)
                    ? "text-[var(--glow-amber)]"
                    : "text-[var(--text-muted)]"
                }`}
                fill={value <= (hoveredRating || rating) ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="reviewer-name" className="text-sm font-medium text-[var(--text-secondary)]">
          Your Name
        </label>
        <input
          id="reviewer-name"
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Enter your name"
          className="ambient-input"
          maxLength={100}
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-medium text-[var(--text-secondary)]">
          Comment <span className="text-[var(--text-muted)]">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={3}
          className="ambient-input resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-[var(--text-muted)] text-right">
          {comment.length}/1000
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--glow-red)]">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || rating === 0 || !reviewerName.trim()}
        className="glow-button w-full !py-3"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </span>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Review
          </>
        )}
      </button>
    </form>
  );
}
