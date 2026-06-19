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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`w-4 h-4 ${
            value <= rating
              ? "text-[var(--glow-amber)]"
              : "text-[var(--text-muted)]"
          }`}
          fill={value <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  onDelete,
}: {
  review: Review;
  onDelete?: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;

    setDeleting(true);
    try {
      await fetch(`/api/reviews?id=${review.id}`, { method: "DELETE" });
      onDelete?.(review.id);
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ambient-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="font-medium text-sm">{review.reviewer_name}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {new Date(review.created_at).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="icon-button !p-1.5 text-[var(--text-muted)] hover:text-[var(--glow-red)]"
            title="Delete review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {review.comment && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {review.comment}
        </p>
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
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleReviewDeleted = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    // Recalculate summary
    const remaining = reviews.filter((r) => r.id !== id);
    const count = remaining.length;
    const average =
      count > 0
        ? remaining.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
    setSummary({ count, average: Math.round(average * 10) / 10 });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[var(--bg-card)] rounded animate-pulse" />
        <div className="h-24 bg-[var(--bg-card)] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      {summary.count > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(summary.average)} />
            <span className="text-lg font-bold">{summary.average}</span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {summary.count} {summary.count === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={handleReviewDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
