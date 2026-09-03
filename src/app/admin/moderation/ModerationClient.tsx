"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Loader2, Search, Ban, Check, Trash2, Sparkles } from "lucide-react";

interface Flag {
  id: string;
  product_id: string;
  product_name: string;
  reason: string;
  severity: "low" | "medium" | "high";
  ai_reviewed: boolean;
  status: string;
  created_at: string;
  stores: { name: string; slug: string; whatsapp_number: string } | null;
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const severityColor = (s: string) =>
  s === "high" ? "var(--glow-red)" : s === "medium" ? "var(--glow-amber)" : "var(--glow-cyan)";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ModerationClient() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/moderation?status=pending");
      if (res.ok) setFlags(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadFlags(); }, []);

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/admin/moderation/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAI }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setScanResult(`Scanned ${data.scanned} products — ${data.flagged} flagged`);
      await loadFlags();
    } catch (e: any) {
      setScanResult(`Scan error: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const resolve = async (flag: Flag, status: "reviewed" | "dismissed", hideProduct: boolean) => {
    setUpdatingId(flag.id);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flag.id, status, hideProduct }),
      });
      if (res.ok) setFlags((f) => f.filter((x) => x.id !== flag.id));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert size={18} style={{ color: "var(--glow-amber)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Content Moderation</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Rule-based + optional AI review of product listings</p>
          </div>
        </div>

        {/* Scan controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} style={{ accentColor: "var(--glow-purple)" }} />
            <Sparkles size={12} /> AI review
          </label>
          <button
            onClick={runScan}
            disabled={scanning}
            className="glow-button"
            style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: scanning ? "wait" : "pointer" }}
          >
            {scanning ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={14} />}
            {scanning ? "Scanning…" : "Scan products"}
          </button>
        </div>
      </div>

      {scanResult && (
        <div style={{ ...glassCard, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.8125rem", borderColor: scanResult.startsWith("Scan error") ? "rgba(239,68,68,0.3)" : "var(--border-subtle)" }}>
          {scanResult}
        </div>
      )}

      {/* Flags list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading flags…</div>
      ) : flags.length === 0 ? (
        <div style={{ ...glassCard, padding: "3rem 1.5rem", textAlign: "center" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <ShieldCheck size={20} style={{ color: "var(--glow-green)" }} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>No flagged listings</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Run a scan to check recent products for policy violations.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {flags.map((flag) => (
            <div key={flag.id} style={{ ...glassCard, padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{flag.product_name}</span>
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: `${severityColor(flag.severity)}22`, color: severityColor(flag.severity), textTransform: "uppercase" }}>
                    {flag.severity}
                  </span>
                  {flag.ai_reviewed && (
                    <span style={{ fontSize: "0.625rem", fontWeight: 600, padding: "0.125rem 0.375rem", borderRadius: "0.25rem", background: "rgba(168,133,247,0.1)", color: "var(--glow-purple)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Sparkles size={9} /> AI
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.125rem" }}>{flag.reason}</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  {flag.stores ? (
                    <a href={`/${flag.stores.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--glow-cyan)", textDecoration: "none" }}>
                      {flag.stores.name} /{flag.stores.slug}
                    </a>
                  ) : "Store removed"} · {timeAgo(flag.created_at)}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                <a
                  href={`/dashboard/products/${flag.product_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", background: "var(--bg-card)", color: "var(--text-secondary)", textDecoration: "none" }}
                >
                  View
                </a>
                <button
                  onClick={() => resolve(flag, "reviewed", true)}
                  disabled={updatingId === flag.id}
                  title="Keep hidden from storefront"
                  style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", border: "none", borderRadius: "0.5rem", background: "rgba(239,68,68,0.12)", color: "var(--glow-red)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                >
                  <Ban size={12} /> Hide
                </button>
                <button
                  onClick={() => resolve(flag, "dismissed", false)}
                  disabled={updatingId === flag.id}
                  title="Not a violation"
                  style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", border: "none", borderRadius: "0.5rem", background: "rgba(34,197,94,0.1)", color: "var(--glow-green)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                >
                  <Check size={12} /> OK
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
