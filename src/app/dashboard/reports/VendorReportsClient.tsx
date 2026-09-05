"use client";

import { useState, useEffect } from "react";
import { Store } from "@/types";
import { FileWarning, CheckCircle, Clock, AlertTriangle, ExternalLink, Loader2, Package, MessageSquare } from "lucide-react";

interface Report {
  id: string;
  type: "product" | "review";
  status: string;
  reason: string;
  details: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  product_name?: string;
  product_image?: string | null;
  reviewer_name?: string;
  review_rating?: number;
  review_comment?: string;
}

interface ReportCounts {
  pending: number;
  resolved: number;
  productPending: number;
  productResolved: number;
  reviewPending: number;
  reviewResolved: number;
}

interface VendorReportsClientProps {
  store: Store;
}

export function VendorReportsClient({ store }: VendorReportsClientProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [counts, setCounts] = useState<ReportCounts | null>(null);
  const [filter, setFilter] = useState<"all" | "resolved" | "pending">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/reports?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setCounts(data.counts || null);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Reports Archive</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          View product and review reports on your store, including resolved items.
        </p>
      </div>

      {/* Summary Cards */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Clock size={16} className="text-[var(--glow-red)]" />}
            label="Pending"
            value={counts.pending}
            color="var(--glow-red)"
          />
          <SummaryCard
            icon={<CheckCircle size={16} className="text-[var(--glow-green)]" />}
            label="Resolved"
            value={counts.resolved}
            color="var(--glow-green)"
          />
          <SummaryCard
            icon={<Package size={16} className="text-[var(--glow-purple)]" />}
            label="Product Reports"
            value={counts.productPending + counts.productResolved}
            color="var(--glow-purple)"
          />
          <SummaryCard
            icon={<MessageSquare size={16} className="text-[var(--glow-cyan)]" />}
            label="Review Reports"
            value={counts.reviewPending + counts.reviewResolved}
            color="var(--glow-cyan)"
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "resolved", "pending"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: filter === tab ? "var(--glow-purple)" : "var(--bg-card)",
              color: filter === tab ? "#fff" : "var(--text-muted)",
              border: `1px solid ${filter === tab ? "var(--glow-purple)" : "var(--border-subtle)"}`,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Loader2 size={24} className="mx-auto mb-3 animate-spin" />
          <p className="text-sm">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <FileWarning size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No {filter === "all" ? "" : filter} reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Type Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: report.type === "product"
                        ? "var(--glow-purple-dim, rgba(168,85,247,0.15))"
                        : "var(--glow-cyan-dim, rgba(6,182,212,0.15))",
                    }}
                  >
                    {report.type === "product"
                      ? <Package size={16} className="text-[var(--glow-purple)]" />
                      : <MessageSquare size={16} className="text-[var(--glow-cyan)]" />
                    }
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {report.type === "product"
                          ? report.product_name || "Product"
                          : `Review by ${report.reviewer_name || "Anonymous"}`
                        }
                      </span>
                      <StatusBadge status={report.status} />
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                      <strong>Reason:</strong> {report.reason}
                      {report.details ? ` — ${report.details}` : ""}
                    </p>

                    {report.type === "review" && report.review_comment && (
                      <p className="text-xs text-[var(--text-muted)] mt-1 italic line-clamp-2">
                        &ldquo;{report.review_comment}&rdquo;
                        {report.review_rating ? ` (${report.review_rating}/5)` : ""}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                      <span>Reported {formatDate(report.created_at)}</span>
                      {report.resolved_at && (
                        <span className="text-[var(--glow-green)]">
                          Resolved {formatDate(report.resolved_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isResolved = status === "resolved";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{
        background: isResolved ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
        color: isResolved ? "var(--glow-green)" : "var(--glow-red)",
      }}
    >
      {isResolved ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
}
