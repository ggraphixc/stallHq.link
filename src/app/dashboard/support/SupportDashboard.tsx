"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  LifeBuoy,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle,
  ChevronLeft,
  Send,
  AlertCircle,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General Question", icon: "💬" },
  { value: "technical", label: "Technical Issue", icon: "🔧" },
  { value: "billing", label: "Billing & Payments", icon: "💳" },
  { value: "bug_report", label: "Bug Report", icon: "🐛" },
  { value: "feature_request", label: "Feature Request", icon: "💡" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "var(--text-muted)" },
  { value: "normal", label: "Normal", color: "var(--glow-cyan)" },
  { value: "high", label: "High", color: "var(--glow-orange, #f97316)" },
  { value: "urgent", label: "Urgent", color: "var(--glow-red)" },
];

const STATUS_COLORS: Record<string, string> = {
  open: "var(--glow-cyan)",
  in_progress: "var(--glow-purple)",
  replied: "var(--glow-green)",
  resolved: "var(--text-muted)",
  closed: "var(--text-muted)",
};

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
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

function statusColor(status: string): string {
  return STATUS_COLORS[status] || "var(--text-muted)";
}

export default function SupportDashboard() {
  const router = useRouter();
  const { error: showError } = useAlert();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) openTicket(ticket);
    }
  }, [searchParams, tickets]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) setTickets(await res.json());
    } catch {}
    setLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setLoadingTicket(true);
    setSelectedTicket(ticket);
    try {
      const res = await fetch("/api/support/tickets/" + ticket.id);
      if (res.ok) setSelectedTicket(await res.json());
    } catch {}
    setLoadingTicket(false);
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, message }),
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      const ticket = await res.json();
      setTickets((prev) => [{ ...ticket, messages: [] }, ...prev]);
      setShowNewTicket(false);
      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("normal");
      openTicket(ticket);
    } catch {
      showError("Failed to create ticket. Please try again.");
    }
    setSubmitting(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const res = await fetch(
        "/api/support/tickets/" + selectedTicket.id + "/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage, sender_role: "vendor" }),
        }
      );
      if (res.ok) {
        const msg = await res.json();
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), msg],
                status: "open",
              }
            : null
        );
        setNewMessage("");
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, status: "open", updated_at: new Date().toISOString() }
              : t
          )
        );
      }
    } catch {}
    setSending(false);
  };

  const inputPadding = isMobile ? "0.75rem" : "0.625rem 0.875rem";

  if (selectedTicket) {
    return (
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: isMobile ? "0 0.75rem" : "0" }}>
        <button
          onClick={() => setSelectedTicket(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          <ChevronLeft size={16} /> Back to tickets
        </button>

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "0.75rem",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: isMobile ? "1rem" : "1.25rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "1rem",
                  background: statusColor(selectedTicket.status) + "15",
                  color: statusColor(selectedTicket.status),
                  border: "1px solid " + statusColor(selectedTicket.status) + "30",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {selectedTicket.status.replace("_", " ")}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                }}
              >
                #{selectedTicket.id.slice(0, 8)}
              </span>
            </div>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                wordBreak: "break-word",
              }}
            >
              {selectedTicket.subject}
            </h2>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.25rem",
                wordBreak: "break-word",
              }}
            >
              {CATEGORY_OPTIONS.find((c) => c.value === selectedTicket.category)
                ?.icon || ""}{" "}
              {CATEGORY_OPTIONS.find((c) => c.value === selectedTicket.category)
                ?.label || ""}{" "}
              ·{" "}
              {new Date(selectedTicket.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: isMobile ? "1rem" : "1.25rem",
              maxHeight: "60vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {loadingTicket ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "2rem",
                }}
              >
                Loading conversation...
              </div>
            ) : (selectedTicket.messages || []).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "2rem",
                }}
              >
                No messages yet
              </div>
            ) : (
              (selectedTicket.messages || []).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection:
                      msg.sender_role === "admin" ? "row" : "row-reverse",
                  }}
                >
                  <div style={{ maxWidth: isMobile ? "85%" : "75%" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        marginBottom: "0.25rem",
                        flexDirection:
                          msg.sender_role === "admin" ? "row" : "row-reverse",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color:
                            msg.sender_role === "admin"
                              ? "var(--glow-purple)"
                              : "var(--glow-cyan)",
                        }}
                      >
                        {msg.sender_role === "admin"
                          ? "Support Team"
                          : "You"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "0.75rem",
                        background:
                          msg.sender_role === "admin"
                            ? "rgba(168,133,247,0.08)"
                            : "rgba(6,182,212,0.08)",
                        border:
                          "1px solid " +
                          (msg.sender_role === "admin"
                            ? "rgba(168,133,247,0.15)"
                            : "rgba(6,182,212,0.15)"),
                        fontSize: "0.8125rem",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply */}
          {selectedTicket.status !== "closed" && (
            <div
              style={{
                padding: isMobile ? "0.75rem" : "1rem 1.25rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                gap: "0.5rem",
              }}
            >
              <input
                className="ambient-input"
                style={{
                  flex: 1,
                  padding: isMobile ? "0.75rem" : "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  borderRadius: "0.5rem",
                  minWidth: 0,
                }}
                placeholder="Type your reply..."
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
                  padding: isMobile ? "0.75rem" : "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  opacity: !newMessage.trim() || sending ? 0.5 : 1,
                  cursor:
                    !newMessage.trim() || sending ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: isMobile ? "0 0.75rem" : "0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: isMobile ? "flex-start" : "space-between",
          gap: isMobile ? "0.75rem" : "0",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(1.25rem,3vw,1.5rem)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <LifeBuoy size={24} style={{ color: "var(--glow-purple)" }} />{" "}
            Support
          </h1>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Get help with your store or report issues
          </p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="glow-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            padding: isMobile ? "0.75rem" : "0.625rem 1rem",
            fontSize: "0.8125rem",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* New Ticket Form Modal */}
      {showNewTicket && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? "0" : "1rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowNewTicket(false)}
          />
          <div
            className="slide-up"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: isMobile ? "100%" : "32rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: isMobile ? "0.75rem 0.75rem 0 0" : "0.75rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              maxHeight: isMobile ? "95vh" : "90vh",
              overflowY: "auto",
              margin: isMobile ? "0" : "0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isMobile ? "0.875rem 1rem" : "1rem 1.25rem",
                borderBottom: "1px solid var(--border-subtle)",
                position: "sticky",
                top: 0,
                background: "var(--bg-secondary)",
                zIndex: 1,
              }}
            >
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>
                New Support Ticket
              </h2>
              <button
                onClick={() => setShowNewTicket(false)}
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.125rem",
                }}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={submitTicket}
              style={{
                padding: isMobile ? "1rem" : "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    display: "block",
                    marginBottom: "0.375rem",
                  }}
                >
                  Subject
                </label>
                <input
                  className="ambient-input"
                  style={{
                    width: "100%",
                    padding: inputPadding,
                    fontSize: "0.8125rem",
                    borderRadius: "0.5rem",
                    boxSizing: "border-box",
                  }}
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      display: "block",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Category
                  </label>
                  <select
                    className="ambient-input"
                    style={{
                      width: "100%",
                      padding: inputPadding,
                      fontSize: "0.8125rem",
                      borderRadius: "0.5rem",
                      background: "var(--bg-primary)",
                      boxSizing: "border-box",
                    }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      display: "block",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    className="ambient-input"
                    style={{
                      width: "100%",
                      padding: inputPadding,
                      fontSize: "0.8125rem",
                      borderRadius: "0.5rem",
                      background: "var(--bg-primary)",
                      boxSizing: "border-box",
                    }}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    display: "block",
                    marginBottom: "0.375rem",
                  }}
                >
                  Message
                </label>
                <textarea
                  className="ambient-input"
                  style={{
                    width: "100%",
                    padding: inputPadding,
                    fontSize: "0.8125rem",
                    borderRadius: "0.5rem",
                    resize: "none",
                    boxSizing: "border-box",
                    minHeight: isMobile ? "6rem" : "auto",
                  }}
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: isMobile ? "stretch" : "flex-end",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  style={{
                    padding: isMobile ? "0.75rem" : "0.625rem 1rem",
                    fontSize: "0.8125rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-subtle)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    order: isMobile ? 2 : 0,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="glow-button"
                  style={{
                    padding: isMobile ? "0.75rem" : "0.625rem 1.25rem",
                    fontSize: "0.8125rem",
                    opacity: submitting ? 0.5 : 1,
                    order: isMobile ? 1 : 0,
                  }}
                >
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
            }}
          >
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "0.75rem",
            }}
          >
            <LifeBuoy
              size={32}
              style={{
                color: "var(--text-muted)",
                margin: "0 auto 0.75rem",
              }}
            />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              No support tickets yet
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Create a ticket if you need help with your store
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: isMobile ? "0.75rem" : "0.875rem 1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.625rem",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--glow-purple)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-subtle)")
              }
            >
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  background: statusColor(ticket.status) + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {ticket.status === "open" ? (
                  <AlertCircle
                    size={16}
                    style={{ color: statusColor(ticket.status) }}
                  />
                ) : ticket.status === "replied" ? (
                  <MessageCircle
                    size={16}
                    style={{ color: statusColor(ticket.status) }}
                  />
                ) : (
                  <CheckCircle
                    size={16}
                    style={{ color: statusColor(ticket.status) }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    marginBottom: "0.125rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {ticket.subject}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      color: statusColor(ticket.status),
                      textTransform: "capitalize",
                    }}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span>·</span>
                  <span>
                    {CATEGORY_OPTIONS.find(
                      (c) => c.value === ticket.category
                    )?.label}
                  </span>
                  <span>·</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Clock size={10} />{" "}
                    {new Date(
                      ticket.updated_at || ticket.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
