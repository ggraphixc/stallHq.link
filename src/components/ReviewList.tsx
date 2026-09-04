"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, Reply, Pencil, Check, X } from "lucide-react";
import { Review } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { ReportReview } from "@/components/ReportReview";

interface ReviewListProps {
  productId: string;
  storeId: string;
  storeName?: string;
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

function ReviewCard({
  review,
  onDelete,
  canDelete,
  canEdit,
  canReply,
  storeName,
  onEdited,
}: {
  review: Review;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  canReply?: boolean;
  storeName?: string;
  onEdited?: (updated: Review) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || "");
  const [reply, setReply] = useState(review.reply || "");

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

  const saveEdit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, rating, comment: comment.trim() || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        onEdited?.(updated);
        setEditing(false);
      }
    } catch { /* Silent */ } finally {
      setBusy(false);
    }
  };

  const saveReply = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, reply: reply.trim() || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        onEdited?.(updated);
        setReplying(false);
      }
    } catch { /* Silent */ } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} type="button" onClick={() => setRating(v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0" }}>
                <Star size={20} style={{ color: v <= rating ? "var(--glow-amber)" : "var(--text-muted)" }} fill={v <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea style={inputStyle} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={saveEdit} disabled={busy} className="glow-button" style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Check size={13} /> Save
            </button>
            <button onClick={() => { setEditing(false); setRating(review.rating); setComment(review.comment || ""); }} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ReportReview reviewId={review.id} />
              {canReply && (
                <button
                  onClick={() => { setReply(review.reply || ""); setReplying(!replying); }}
                  style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: "0.375rem", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", transition: "color 0.15s" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "var(--glow-cyan)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="Reply as store"
                >
                  <Reply size={14} /> Reply
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: "0.375rem", transition: "color 0.15s" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "var(--glow-purple)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="Edit review"
                >
                  <Pencil size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: "0.375rem", transition: "color 0.15s" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "var(--glow-red)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="Delete review"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          {review.comment && (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "0.75rem" }}>{review.comment}</p>
          )}
        </>
      )}

      {/* Store reply */}
      {!editing && (
        <>
          {replying ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.875rem", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.12)", borderRadius: "0.625rem", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--glow-cyan)", display: "flex", alignItems: "center", gap: "0.375rem", margin: 0 }}>
                <Reply size={12} /> Reply as {storeName || "this store"}
              </p>
              <textarea style={{ ...inputStyle, background: "var(--bg-secondary)" }} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank the customer or clarify anything…" maxLength={1000} />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={saveReply} disabled={busy} className="glow-button" style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
                  {busy ? "Saving…" : "Post reply"}
                </button>
                <button onClick={() => setReplying(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : review.reply ? (
            <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.875rem", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.12)", borderRadius: "0.625rem", padding: "0.75rem" }}>
              <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "50%", background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Reply size={12} style={{ color: "var(--glow-cyan)" }} />
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--glow-cyan)" }}>
                  {storeName || "Store"} · {review.replied_at ? new Date(review.replied_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : ""}
                </p>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{review.reply}</p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function ReviewList({ productId, storeId, storeName }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [storeDisplayName, setStoreDisplayName] = useState<string | null>(storeName || null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        // Check if user owns this store
        supabase.from("stores").select("id, name").eq("id", storeId).eq("user_id", user.id).single().then(({ data }) => {
          if (data) {
            setIsStoreOwner(true);
            if (!storeDisplayName) setStoreDisplayName((data as any).name || null);
          }
        });
      }
    });
  }, [storeId, storeDisplayName]);

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
    setReviews((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      const count = remaining.length;
      const average = count > 0 ? remaining.reduce((sum, r) => sum + r.rating, 0) / count : 0;
      setSummary({ count, average: Math.round(average * 10) / 10 });
      return remaining;
    });
  };

  const handleReviewEdited = (updated: Review) => {
    setReviews((prev) => {
      const remaining = prev.map((r) => (r.id === updated.id ? updated : r));
      const count = remaining.length;
      const average = count > 0 ? remaining.reduce((sum, r) => sum + r.rating, 0) / count : 0;
      setSummary({ count, average: Math.round(average * 10) / 10 });
      return remaining;
    });
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
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={handleReviewDeleted}
              onEdited={handleReviewEdited}
              canDelete={isStoreOwner || (currentUserId !== null && review.user_id === currentUserId)}
              canEdit={isStoreOwner || (currentUserId !== null && review.user_id === currentUserId)}
              canReply={isStoreOwner}
              storeName={storeDisplayName || undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
