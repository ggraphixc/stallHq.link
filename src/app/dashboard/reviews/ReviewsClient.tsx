"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Star, Reply, Trash2, Eye, EyeOff, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ReviewRow {
  id: string;
  store_id: string;
  product_id: string | null;
  user_id: string | null;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  hidden: boolean;
  created_at: string;
  products: { id: string; name: string; image_url?: string | null } | null;
}

interface ReviewsClientProps {
  store: { id: string; name: string; slug: string };
  reviews: ReviewRow[];
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
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

function Stars({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.125rem", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} size={12} style={{ color: v <= value ? "var(--glow-amber)" : "var(--text-muted)" }} fill={v <= value ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export default function ReviewsClient({ store, reviews }: ReviewsClientProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ReviewRow[]>(reviews);
  const [filter, setFilter] = useState<"all" | "store" | "product">("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const storeReviews = rows.filter((r) => !r.product_id);
  const productReviews = rows.filter((r) => r.product_id);
  const visible = filter === "all" ? rows : filter === "store" ? storeReviews : productReviews;

  const average = useMemo(() => {
    const visibleRows = rows.filter((r) => !r.hidden);
    if (visibleRows.length === 0) return 0;
    return Math.round((visibleRows.reduce((s, r) => s + r.rating, 0) / visibleRows.length) * 10) / 10;
  }, [rows]);

  const saveReply = async (row: ReviewRow) => {
    setBusyId(row.id);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, reply: replyDraft.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save reply");
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save reply");
    } finally {
      setBusyId(null);
      setReplyingId(null);
      setReplyDraft("");
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  };

  const toggleHidden = async (row: ReviewRow) => {
    setBusyId(row.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reviews")
        .update({ hidden: !row.hidden, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, hidden: !r.hidden } : r)));
    } catch {
      alert("Failed to update review");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.03)", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(168,133,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={18} style={{ color: "var(--glow-purple)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Reviews & Replies</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {store.name} · {rows.length} review{rows.length === 1 ? "" : "s"} · {average} ★ average
          </p>
        </div>
        <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", background: "var(--bg-card)", color: "var(--text-secondary)", textDecoration: "none" }}>
          View store
        </a>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {([
          { key: "all" as const, label: `All (${rows.length})` },
          { key: "store" as const, label: `On store (${storeReviews.length})` },
          { key: "product" as const, label: `On products (${productReviews.length})` },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "0.5rem 0.875rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              borderRadius: "9999px", border: "1px solid var(--border-subtle)",
              background: filter === f.key ? "rgba(168,133,247,0.12)" : "rgba(255,255,255,0.02)",
              color: filter === f.key ? "var(--glow-purple)" : "var(--text-secondary)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div style={{ ...glassCard, padding: "3rem 1.5rem", textAlign: "center" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "rgba(168,133,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Inbox size={20} style={{ color: "var(--glow-purple)" }} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>No reviews here yet</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Reviews customers leave on your store and products will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {visible.map((row) => (
            <div key={row.id} style={{ ...glassCard, padding: "0.875rem 1rem", opacity: row.hidden ? 0.65 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(168,133,247,0.2), rgba(6,182,212,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700, color: "var(--glow-purple)", flexShrink: 0 }}>
                  {row.reviewer_name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.125rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{row.reviewer_name}</span>
                    <Stars value={row.rating} />
                    {row.hidden && (
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: "rgba(239,68,68,0.12)", color: "var(--glow-red)", textTransform: "uppercase" }}>Hidden</span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                    {row.products ? <>on <strong>{row.products.name}</strong> · </> : <>on this store · </>}
                    {fmtDate(row.created_at)}
                    {row.user_id ? " · verified customer" : ""}
                  </p>
                  {row.comment && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.375rem" }}>{row.comment}</p>}

                  {/* Owner reply display */}
                  {row.reply && replyingId !== row.id && (
                    <div style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.12)", borderRadius: "0.625rem", padding: "0.625rem 0.75rem", marginBottom: "0.5rem" }}>
                      <p style={{ margin: "0 0 0.25rem", fontSize: "0.6875rem", fontWeight: 700, color: "var(--glow-cyan)" }}>
                        Your reply{row.replied_at ? ` · ${fmtDate(row.replied_at)}` : ""}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{row.reply}</p>
                    </div>
                  )}

                  {/* Reply editor */}
                  {replyingId === row.id && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <textarea style={{ ...inputStyle, minHeight: "4.5rem" }} value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder={`Reply as ${store.name}…`} maxLength={1000} />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => saveReply(row)}
                          disabled={busyId === row.id}
                          className="glow-button"
                          style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          {busyId === row.id ? "Saving…" : replyDraft.trim() ? "Post reply" : "Remove reply"}
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setReplyDraft(""); }}
                          style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                  <button
                    onClick={() => { setReplyingId(row.id); setReplyDraft(row.reply || ""); }}
                    title={row.reply ? "Edit reply" : "Reply publicly"}
                    style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", border: "none", borderRadius: "0.5rem", background: "rgba(6,182,212,0.1)", color: "var(--glow-cyan)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                  >
                    <Reply size={12} /> {row.reply ? "Edit" : "Reply"}
                  </button>
                  <button
                    onClick={() => toggleHidden(row)}
                    disabled={busyId === row.id}
                    title={row.hidden ? "Show on storefront" : "Hide from storefront"}
                    style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", border: "none", borderRadius: "0.5rem", background: row.hidden ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.12)", color: row.hidden ? "var(--glow-green)" : "var(--glow-red)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                  >
                    {row.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                    {row.hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    onClick={() => deleteReview(row.id)}
                    disabled={busyId === row.id}
                    title="Delete review permanently"
                    style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", border: "none", borderRadius: "0.5rem", background: "rgba(239,68,68,0.12)", color: "var(--glow-red)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
