"use client";

import { useState, useEffect } from "react";
import { Mail, Check, CheckCheck, MousePointerClick, X as XIcon, Clock } from "lucide-react";

interface EmailLog {
  id: string;
  subject: string;
  type: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  opened_count: number;
  clicked_count: number;
  created_at: string;
}

interface EmailHistoryProps {
  storeId: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  sent: { icon: Check, color: "var(--text-muted)", label: "Sent" },
  delivered: { icon: CheckCheck, color: "var(--glow-green)", label: "Delivered" },
  opened: { icon: Mail, color: "var(--glow-cyan)", label: "Opened" },
  clicked: { icon: MousePointerClick, color: "var(--glow-purple)", label: "Clicked" },
  bounced: { icon: XIcon, color: "var(--glow-red)", label: "Bounced" },
  complained: { icon: XIcon, color: "var(--glow-red)", label: "Complained" },
};

const TYPE_LABELS: Record<string, string> = {
  reminder: "📋",
  warning: "⚠️",
  info: "ℹ️",
  promotion: "🎉",
  custom: "✉️",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function EmailHistory({ storeId }: EmailHistoryProps) {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/email-logs?store_id=${storeId}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading && logs.length === 0) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
        Loading email history...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
        No emails sent yet
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Email History ({total})
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {logs.map((log, i) => {
          const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.sent;
          const StatusIcon = statusConfig.icon;
          return (
            <div key={log.id} style={{
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
              padding: "0.5rem 0",
              borderBottom: i < logs.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}>
              <div style={{
                width: "1.5rem", height: "1.5rem", borderRadius: "0.25rem",
                background: `${statusConfig.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: "0.125rem",
              }}>
                <StatusIcon size={10} style={{ color: statusConfig.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ fontSize: "0.5625rem" }}>{TYPE_LABELS[log.type] || "✉️"}</span>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.subject}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.125rem" }}>
                  <span style={{ fontSize: "0.5625rem", color: statusConfig.color }}>{statusConfig.label}</span>
                  <span style={{ fontSize: "0.5625rem", color: "var(--text-muted)" }}>{timeAgo(log.created_at)}</span>
                  {log.opened_count > 0 && (
                    <span style={{ fontSize: "0.5625rem", color: "var(--glow-cyan)" }}>Opened {log.opened_count}×</span>
                  )}
                  {log.clicked_count > 0 && (
                    <span style={{ fontSize: "0.5625rem", color: "var(--glow-purple)" }}>Clicked {log.clicked_count}×</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {total > 10 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.375rem", marginTop: "0.5rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.625rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.25rem", color: "var(--text-muted)", cursor: "pointer", opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", padding: "0.25rem 0.375rem" }}>{page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 10}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.625rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.25rem", color: "var(--text-muted)", cursor: "pointer", opacity: logs.length < 10 ? 0.5 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
