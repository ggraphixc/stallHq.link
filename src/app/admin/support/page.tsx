"use client";

import { useState, useEffect, useMemo } from "react";
import { useAlert } from "@/contexts/AlertContext";
import {
  LifeBuoy,
  MessageCircle,
  Send,
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  User,
  RefreshCw,
  Inbox,
  ArrowRight,
  CircleDot,
  Circle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const CATEGORY_OPTIONS: Record<string, string> = {
  general: "General",
  technical: "Technical",
  billing: "Billing",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
};

const STATUS_COLORS: Record<string, string> = {
  open: "var(--glow-cyan)",
  in_progress: "var(--glow-purple)",
  replied: "var(--glow-green)",
  resolved: "var(--text-muted)",
  closed: "var(--text-muted)",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  replied: "Replied",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--text-muted)",
  normal: "var(--glow-cyan)",
  high: "#f97316",
  urgent: "var(--glow-red)",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  store?: { name: string; slug: string };
  messages?: Message[];
}

interface Message {
  id: string;
  message: string;
  sender_role: string;
  sender_id: string;
  created_at: string;
  sender?: { id: string; email: string };
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminSupport() {
  const { error: showError } = useAlert();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets?admin=true");
      if (res.ok) setTickets(await res.json());
    } catch {
      showError("Failed to load tickets");
    }
    setLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setLoadingTicket(true);
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`);
      if (res.ok) setSelectedTicket(await res.json());
    } catch {
      showError("Failed to load ticket");
    }
    setLoadingTicket(false);
  };

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
      if (selectedTicket?.id === ticketId)
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
    } catch {
      showError("Failed to update status");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/support/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage, sender_role: "admin" }),
        }
      );
      if (res.ok) {
        const msg = await res.json();
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), msg],
                status: "replied",
              }
            : null
        );
        setNewMessage("");
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, status: "replied", updated_at: new Date().toISOString() }
              : t
          )
        );
      } else {
        showError("Failed to send reply");
      }
    } catch {
      showError("Failed to send reply");
    }
    setSending(false);
  };

  const filteredTickets =
    filterStatus === "all"
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  const ticketCounts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      replied: tickets.filter((t) => t.status === "replied").length,
    }),
    [tickets]
  );

  // ── Detail View ──────────────────────────────────────────────────────
  if (selectedTicket) {
    const STATUS_ICONS: Record<string, React.ReactNode> = {
      open: <CircleDot size={14} />,
      in_progress: <RefreshCw size={14} />,
      replied: <MessageCircle size={14} />,
      resolved: <CheckCircle2 size={14} />,
      closed: <Lock size={14} />,
    };

    return (
      <div
        style={{
          maxWidth: "60rem",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => setSelectedTicket(null)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: "1.5rem",
            padding: "0.25rem 0",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--glow-purple)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ChevronLeft size={16} /> Back to tickets
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 17rem",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {/* ── Conversation Panel ──────────────────── */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            {/* Ticket header */}
            <div
              style={{
                padding: isMobile ? "1.25rem 1rem" : "1.5rem 1.75rem",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  marginBottom: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.6875rem",
                    padding: "0.25rem 0.625rem",
                    borderRadius: "2rem",
                    background: `${STATUS_COLORS[selectedTicket.status]}18`,
                    color: STATUS_COLORS[selectedTicket.status],
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {STATUS_ICONS[selectedTicket.status]}
                  {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    padding: "0.25rem 0.625rem",
                    borderRadius: "2rem",
                    background: `${PRIORITY_COLORS[selectedTicket.priority]}18`,
                    color: PRIORITY_COLORS[selectedTicket.priority],
                    fontWeight: 600,
                    textTransform: "capitalize",
                    letterSpacing: "0.02em",
                  }}
                >
                  {PRIORITY_LABELS[selectedTicket.priority] || selectedTicket.priority}
                </span>
              </div>
              <h2
                style={{
                  fontSize: isMobile ? "1.125rem" : "1.25rem",
                  fontWeight: 700,
                  lineHeight: 1.4,
                  marginBottom: "0.375rem",
                }}
              >
                {selectedTicket.subject}
              </h2>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <User size={11} />
                  {selectedTicket.store?.name || "Unknown"}
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>
                  {CATEGORY_OPTIONS[selectedTicket.category] || selectedTicket.category}
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>#{selectedTicket.id.slice(0, 8)}</span>
              </p>
            </div>

            {/* Messages */}
            <div
              style={{
                padding: isMobile ? "1rem" : "1.5rem 1.75rem",
                maxHeight: "52vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {loadingTicket ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <RefreshCw
                    size={20}
                    style={{
                      animation: "spin 1s linear infinite",
                      color: "var(--glow-purple)",
                    }}
                  />
                </div>
              ) : (selectedTicket.messages || []).length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "var(--text-muted)",
                    fontSize: "0.8125rem",
                  }}
                >
                  No messages yet
                </div>
              ) : (
                (selectedTicket.messages || []).map((msg, i) => {
                  const isAdmin = msg.sender_role === "admin";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: isAdmin ? "row-reverse" : "row",
                        gap: "0.625rem",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "50%",
                          background: isAdmin
                            ? "rgba(168,133,247,0.15)"
                            : "rgba(6,182,212,0.15)",
                          border: `1px solid ${isAdmin ? "rgba(168,133,247,0.25)" : "rgba(6,182,212,0.25)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: isAdmin ? "var(--glow-purple)" : "var(--glow-cyan)",
                        }}
                      >
                        {isAdmin ? "A" : "V"}
                      </div>

                      {/* Bubble */}
                      <div
                        style={{
                          maxWidth: "78%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAdmin ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.3rem",
                            flexDirection: isAdmin ? "row-reverse" : "row",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              color: isAdmin ? "var(--glow-purple)" : "var(--glow-cyan)",
                            }}
                          >
                            {isAdmin ? "Admin" : "Vendor"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.625rem",
                              color: "var(--text-muted)",
                              opacity: 0.7,
                            }}
                          >
                            {formatTimestamp(msg.created_at)}
                          </span>
                        </div>
                        <div
                          style={{
                            padding: "0.875rem 1rem",
                            borderRadius: isAdmin
                              ? "1rem 1rem 0.25rem 1rem"
                              : "1rem 1rem 1rem 0.25rem",
                            background: isAdmin
                              ? "rgba(168,133,247,0.08)"
                              : "rgba(6,182,212,0.08)",
                            border: `1px solid ${isAdmin ? "rgba(168,133,247,0.15)" : "rgba(6,182,212,0.15)"}`,
                            fontSize: "0.8125rem",
                            lineHeight: 1.7,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply bar */}
            <div
              style={{
                padding: isMobile ? "0.75rem 1rem" : "1rem 1.75rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                gap: "0.625rem",
                alignItems: "center",
              }}
            >
              <input
                className="ambient-input"
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  borderRadius: "0.625rem",
                  border: "1px solid var(--border-subtle)",
                }}
                placeholder="Reply as support..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="glow-button"
                style={{
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.8125rem",
                  borderRadius: "0.625rem",
                  opacity: !newMessage.trim() || sending ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  transition: "opacity 0.15s",
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Status card */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.75rem",
                }}
              >
                Status
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {(
                  ["open", "in_progress", "replied", "resolved", "closed"] as const
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selectedTicket.id, s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.625rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      background:
                        selectedTicket.status === s
                          ? `${STATUS_COLORS[s]}12`
                          : "transparent",
                      color:
                        selectedTicket.status === s
                          ? STATUS_COLORS[s]
                          : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.15s",
                      fontWeight: selectedTicket.status === s ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTicket.status !== s) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        e.currentTarget.style.color = STATUS_COLORS[s];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTicket.status !== s) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }
                    }}
                  >
                    <span style={{ width: 16, display: "inline-flex", justifyContent: "center" }}>
                      {selectedTicket.status === s ? (
                        STATUS_ICONS[s]
                      ) : (
                        <Circle size={8} style={{ opacity: 0.3 }} />
                      )}
                    </span>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Details card */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.75rem",
                }}
              >
                Details
              </p>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                {[
                  {
                    label: "Category",
                    value: CATEGORY_OPTIONS[selectedTicket.category] || selectedTicket.category,
                  },
                  {
                    label: "Priority",
                    value: (
                      <span
                        style={{
                          color: PRIORITY_COLORS[selectedTicket.priority],
                          textTransform: "capitalize",
                          fontWeight: 600,
                        }}
                      >
                        {PRIORITY_LABELS[selectedTicket.priority] || selectedTicket.priority}
                      </span>
                    ),
                  },
                  {
                    label: "Store",
                    value: selectedTicket.store?.name || "N/A",
                  },
                  {
                    label: "Created",
                    value: new Date(selectedTicket.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  },
                  {
                    label: "Updated",
                    value: timeAgo(selectedTicket.updated_at),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: "60rem",
        margin: "0 auto",
        padding: isMobile ? "0 clamp(0.75rem, 3vw, 1rem)" : "0",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              width: 2.5,
              height: 2.5,
              borderRadius: "0.625rem",
              background: "rgba(168,133,247,0.12)",
              border: "1px solid rgba(168,133,247,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LifeBuoy size={18} style={{ color: "var(--glow-purple)" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              Support Tickets
            </h1>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginTop: "0.125rem",
              }}
            >
              Manage vendor support requests and inquiries
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}
      >
        {(["all", "open", "in_progress", "replied"] as const).map((s) => {
          const isActive = filterStatus === s;
          const count =
            s === "all"
              ? ticketCounts.all
              : ticketCounts[s as keyof typeof ticketCounts] || 0;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                flex: "0 0 auto",
                padding: "0.5rem 1rem",
                borderRadius: "2rem",
                border: isActive
                  ? "1px solid var(--glow-purple)"
                  : "1px solid var(--border-subtle)",
                background: isActive
                  ? "rgba(168,133,247,0.1)"
                  : "var(--bg-secondary)",
                color: isActive ? "var(--glow-purple)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--glow-purple)";
                  e.currentTarget.style.color = "var(--glow-purple)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {s === "all"
                ? "All"
                : s === "in_progress"
                  ? "Active"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
              <span
                style={{
                  fontSize: "0.625rem",
                  padding: "0.1rem 0.375rem",
                  borderRadius: "1rem",
                  background: isActive
                    ? "rgba(168,133,247,0.2)"
                    : "rgba(255,255,255,0.05)",
                  fontWeight: 700,
                  minWidth: 1.25,
                  textAlign: "center",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tickets */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "1rem",
            }}
          >
            <RefreshCw
              size={24}
              style={{
                animation: "spin 1s linear infinite",
                color: "var(--glow-purple)",
              }}
            />
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginTop: "1rem",
              }}
            >
              Loading tickets...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "1rem",
            }}
          >
            <div
              style={{
                width: 4.5,
                height: 4.5,
                borderRadius: "1rem",
                background: "rgba(168,133,247,0.08)",
                border: "1px solid rgba(168,133,247,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Inbox size={32} style={{ color: "var(--text-muted)" }} />
            </div>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.375rem",
              }}
            >
              No tickets found
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                maxWidth: "24rem",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              {filterStatus === "all"
                ? "When vendors submit support requests, they will appear here."
                : `No ${STATUS_LABELS[filterStatus]?.toLowerCase() || filterStatus} tickets at the moment.`}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "0.875rem",
                padding: isMobile ? "1rem" : "1.125rem 1.25rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.875rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(168,133,247,0.4)";
                e.currentTarget.style.background = "rgba(168,133,247,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "var(--bg-secondary)";
              }}
            >
              {/* Status dot */}
              <div
                style={{
                  width: 2.25,
                  height: 2.25,
                  borderRadius: "50%",
                  background: `${STATUS_COLORS[ticket.status]}18`,
                  border: `2px solid ${STATUS_COLORS[ticket.status]}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${STATUS_COLORS[ticket.status]}25`,
                }}
              >
                <div
                  style={{
                    width: 0.5,
                    height: 0.5,
                    borderRadius: "50%",
                    background: STATUS_COLORS[ticket.status],
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "0.25rem",
                    lineHeight: 1.4,
                  }}
                >
                  {ticket.subject}
                </div>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <User size={10} />
                  <span style={{ fontWeight: 500 }}>
                    {ticket.store?.name || "Unknown"}
                  </span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{CATEGORY_OPTIONS[ticket.category]}</span>
                </div>
                <div
                  style={{
                    fontSize: "0.625rem",
                    color: "var(--text-muted)",
                    opacity: 0.7,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <Clock size={9} />
                  {timeAgo(ticket.updated_at || ticket.created_at)}
                </div>
              </div>

              {/* Priority badge */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.375rem",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "0.625rem",
                    padding: "0.1875rem 0.5rem",
                    borderRadius: "2rem",
                    background: `${PRIORITY_COLORS[ticket.priority]}15`,
                    color: PRIORITY_COLORS[ticket.priority],
                    border: `1px solid ${PRIORITY_COLORS[ticket.priority]}25`,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                </span>
                <ArrowRight
                  size={14}
                  style={{
                    color: "var(--text-muted)",
                    opacity: 0.4,
                  }}
                />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
