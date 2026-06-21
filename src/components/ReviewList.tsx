"use client";

import { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import { Review } from "@/types";

interface ReviewListProps {
  productId: string;
  storeId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "0.0625rem" }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={16}
          style={{ color: value <= rating ? "var(--glow-amber)" : "var(--text-muted)" }}
          fill={value <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, onDelete }: { review: Review; onDelete?: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/reviews?id=${review.id}`, { method: "DELETE" });
      onDelete?.(review.id);
    } catch { /* Silent */ } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <StarRating rating={review.rating} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{review.reviewer_name}</span>
          </div>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            {new Date(review.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: "0.375rem", transition: "color 0.15s" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--glow-red)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            title="Delete review"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {review.comment && (
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "0.75rem" }}>{review.comment}</p>
      )}
    </div>
  );
}

export function ReviewList({ productId, storeId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setSummary(data.summary);
      }
    } catch { /* Silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const handleReviewDeleted = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    const remaining = reviews.filter((r) => r.id !== id);
    const count = remaining.length;
    const average = count > 0 ? remaining.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    setSummary({ count, average: Math.round(average * 10) / 10 });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ height: "2rem", width: "12rem", background: "var(--bg-card)", borderRadius: "0.5rem", opacity: 0.5 }} />
        <div style={{ height: "6rem", background: "var(--bg-card)", borderRadius: "0.5rem", opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {summary.count > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <StarRating rating={Math.round(summary.average)} />
            <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>{summary.average}</span>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {summary.count} {summary.count === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onDelete={handleReviewDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
