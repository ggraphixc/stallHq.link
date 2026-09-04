"use client";

import { useState } from "react";
import { Flag, X, Loader2 } from "lucide-react";

const REASONS = [
  { value: "fake", label: "Fake review" },
  { value: "offensive", label: "Offensive language" },
  { value: "spam", label: "Spam or irrelevant" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "irrelevant", label: "Wrong product/store" },
  { value: "other", label: "Something else" },
];

export function ReportReview({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason) { setError("Please choose a reason"); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/review-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, reason, details: details.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit report");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Report this review"
        style={{ padding: "0.375rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: "0.375rem", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", transition: "color 0.15s" }}
        onMouseOver={(e) => (e.currentTarget.style.color = "var(--glow-amber)")}
        onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Flag size={13} /> Report
      </button>
    );
  }

  return (
    <div style={{ marginTop: "0.75rem", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "0.625rem", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      {done ? (
        <>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--glow-green)", fontWeight: 600 }}>
            ✓ Report submitted — our team will review it.
          </p>
          <button onClick={() => setOpen(false)} style={{ alignSelf: "flex-start", padding: "0.375rem 0.75rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}>
            Close
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Flag size={14} style={{ color: "var(--glow-amber)" }} /> Report this review
            </p>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.25rem" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setReason(r.value); setError(""); }}
                style={{
                  padding: "0.375rem 0.625rem", fontSize: "0.6875rem", borderRadius: "9999px", cursor: "pointer",
                  background: reason === r.value ? "rgba(245,158,11,0.15)" : "var(--bg-card)",
                  border: reason === r.value ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--border-subtle)",
                  color: reason === r.value ? "var(--glow-amber)" : "var(--text-secondary)",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none", resize: "none", minHeight: "3.5rem" }}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add details (optional)"
            maxLength={1000}
          />
          {error && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--glow-red)" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={submit}
              disabled={busy}
              style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", border: "none", borderRadius: "0.5rem", background: "rgba(245,158,11,0.15)", color: "var(--glow-amber)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontWeight: 600 }}
            >
              {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Flag size={13} />}
              {busy ? "Submitting…" : "Submit report"}
            </button>
            <button onClick={() => setOpen(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
