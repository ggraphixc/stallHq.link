"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Send, Reply, Pencil, Trash2, Check, X } from "lucide-react";
import { Review } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface StoreReviewsProps {
  storeId: string;
  storeName?: string;
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

function ReviewRow({
  review,
  isStoreOwner,
  isAuthor,
  storeName,
  onDeleted,
  onEdited,
}: {
  review: Review;
  isStoreOwner: boolean;
  isAuthor: boolean;
  storeName?: string;
  onDeleted: (id: string) => void;
  onEdited: (updated: Review) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState(review.reply || "");
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || "");

  const remove = async () => {
    if (!confirm("Delete this review?")) return;
    setBusy(true);
    try {
      await fetch(`/api/reviews?id=${review.id}`, { method: "DELETE" });
      onDeleted(review.id);
    } finally {
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
      if (res.ok) onEdited(await res.json());
      setReplying(false);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, rating: editRating, comment: editComment.trim() || null }),
      });
      if (res.ok) onEdited(await res.json());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...glassCard, padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
        <div style={{
          width: "1.75rem", height: "1.75rem", borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(168,133,247,0.2), rgba(6,182,212,0.15))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.625rem", fontWeight: 700, color: "var(--glow-purple)",
          flexShrink: 0,
        }}>
          {review.reviewer_name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            {review.reviewer_name}
            {isAuthor && <span style={{ marginLeft: "0.375rem", fontSize: "0.625rem", color: "var(--glow-purple)" }}>You</span>}
          </p>
          <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
            {new Date(review.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem" }}>
          {(isStoreOwner || isAuthor) && (
            <button onClick={() => setEditing(true)} title="Edit review" disabled={busy} style={{ padding: "0.25rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <Pencil size={13} />
            </button>
          )}
          {(isStoreOwner || isAuthor) && (
            <button onClick={remove} title="Delete review" disabled={busy} style={{ padding: "0.25rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <Stars value={editRating} onChange={setEditRating} />
          <textarea style={inputStyle} value={editComment} onChange={(e) => setEditComment(e.target.value)} maxLength={1000} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={saveEdit} disabled={busy} className="glow-button" style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Check size={13} /> Save
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {review.comment && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{review.comment}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: review.comment ? "0.5rem" : 0 }}>
            <Stars value={review.rating} />
            {isStoreOwner && (
              <button onClick={() => { setReplying(true); setReply(review.reply || ""); }} style={{ background: "none", border: "none", color: "var(--glow-cyan)", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Reply size={13} /> {review.reply ? "Edit reply" : "Reply"}
              </button>
            )}
          </div>
        </>
      )}

      {replying && (
        <div style={{ marginTop: "0.75rem", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.12)", borderRadius: "0.625rem", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <textarea style={inputStyle} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply as ${storeName || "this store"}…`} maxLength={1000} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={saveReply} disabled={busy} className="glow-button" style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
              {busy ? "Saving…" : "Post reply"}
            </button>
            <button onClick={() => setReplying(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {review.reply && !replying && (
        <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.75rem", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.12)", borderRadius: "0.625rem", padding: "0.75rem" }}>
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
      )}
    </div>
  );
}

export function StoreReviews({ storeId, storeName }: StoreReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [displayName, setDisplayName] = useState<string | undefined>(storeName);

  // Determine viewer role (author of a review / owner of the store)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      supabase.from("stores").select("id, name").eq("id", storeId).eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setIsStoreOwner(true);
          if (!displayName) setDisplayName((data as any).name || undefined);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?store_id=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        const storeReviews = (data.reviews || []).filter((r: Review) => !r.product_id);
        setReviews(storeReviews);
        const count = storeReviews.length;
        const average = count > 0 ? storeReviews.reduce((s: number, r: Review) => s + r.rating, 0) / count : 0;
        setSummary({ count, average: Math.round(average * 10) / 10 });
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
            <ReviewRow
              key={r.id}
              review={r}
              isStoreOwner={isStoreOwner}
              isAuthor={currentUserId !== null && r.user_id === currentUserId}
              storeName={displayName}
              onDeleted={(id) => setReviews((prev) => prev.filter((x) => x.id !== id))}
              onEdited={(updated) => setReviews((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
