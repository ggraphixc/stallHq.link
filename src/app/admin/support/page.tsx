"use client";

import { useState, useEffect } from "react";
import { LifeBuoy, MessageCircle, Send, ChevronLeft, Clock, CheckCircle, AlertCircle, Filter, User } from "lucide-react";

const CATEGORY_OPTIONS: Record<string, string> = {
  general: "General", technical: "Technical", billing: "Billing", bug_report: "Bug Report", feature_request: "Feature Request",
};
const STATUS_COLORS: Record<string, string> = {
  open: "var(--glow-cyan)", in_progress: "var(--glow-purple)", replied: "var(--glow-green)", resolved: "var(--text-muted)", closed: "var(--text-muted)",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--text-muted)", normal: "var(--glow-cyan)", high: "#f97316", urgent: "var(--glow-red)",
};

interface Ticket {
  id: string; subject: string; category: string; status: string; priority: string;
  user_id: string; created_at: string; updated_at: string;
  store?: { name: string; slug: string };
  messages?: Message[];
}
interface Message {
  id: string; message: string; sender_role: string; sender_id: string; created_at: string;
  sender?: { id: string; email: string };
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets?admin=true");
      if (res.ok) setTickets(await res.json());
    } catch {}
    setLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setLoadingTicket(true);
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`);
      if (res.ok) setSelectedTicket(await res.json());
    } catch {}
    setLoadingTicket(false);
  };

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status } : null);
    } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage, sender_role: "admin" }),
      });
      if (res.ok) {
        const msg = await res.json();
        setSelectedTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), msg], status: "replied" } : null);
        setNewMessage("");
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: "replied", updated_at: new Date().toISOString() } : t));
      }
    } catch {}
    setSending(false);
  };

  const filteredTickets = filterStatus === "all" ? tickets : tickets.filter(t => t.status === filterStatus);
  const ticketCounts = { open: tickets.filter(t => t.status === "open").length, in_progress: tickets.filter(t => t.status === "in_progress").length, replied: tickets.filter(t => t.status === "replied").length, all: tickets.length };

  if (selectedTicket) {
    return (
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <button onClick={() => setSelectedTicket(null)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "1rem" }}>
          <ChevronLeft size={16} /> Back to tickets
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 16rem", gap: "1rem" }}>
          {/* Conversation */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "1rem", background: `${STATUS_COLORS[selectedTicket.status]}15`, color: STATUS_COLORS[selectedTicket.status], border: `1px solid ${STATUS_COLORS[selectedTicket.status]}30`, textTransform: "uppercase" }}>
                  {selectedTicket.status.replace("_", " ")}
                </span>
                <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "1rem", background: `${PRIORITY_COLORS[selectedTicket.priority]}15`, color: PRIORITY_COLORS[selectedTicket.priority], border: `1px solid ${PRIORITY_COLORS[selectedTicket.priority]}30`, textTransform: "capitalize" }}>
                  {selectedTicket.priority}
                </span>
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{selectedTicket.subject}</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {CATEGORY_OPTIONS[selectedTicket.category] || selectedTicket.category} · Ticket #{selectedTicket.id.slice(0, 8)}
              </p>
            </div>
            <div style={{ padding: "1.25rem", maxHeight: "50vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {loadingTicket ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Loading...</div>
              ) : (selectedTicket.messages || []).map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: msg.sender_role === "admin" ? "row-reverse" : "row" }}>
                  <div style={{ maxWidth: "75%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem", flexDirection: msg.sender_role === "admin" ? "row-reverse" : "row" }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: msg.sender_role === "admin" ? "var(--glow-purple)" : "var(--glow-cyan)" }}>
                        {msg.sender_role === "admin" ? "Support Team" : "Vendor"}
                      </span>
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", background: msg.sender_role === "admin" ? "rgba(168,133,247,0.08)" : "rgba(6,182,212,0.08)", border: `1px solid ${msg.sender_role === "admin" ? "rgba(168,133,247,0.15)" : "rgba(6,182,212,0.15)"}`, fontSize: "0.8125rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "0.5rem" }}>
              <input className="ambient-input" style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} placeholder="Reply as support..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} />
              <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="glow-button" style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", opacity: !newMessage.trim() || sending ? 0.5 : 1 }}><Send size={16} /></button>
            </div>
          </div>
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Status</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {(["open", "in_progress", "replied", "resolved", "closed"] as const).map((s) => (
                  <button key={s} onClick={() => updateStatus(selectedTicket.id, s)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", border: "none", background: selectedTicket.status === s ? `${STATUS_COLORS[s]}15` : "transparent", color: selectedTicket.status === s ? STATUS_COLORS[s] : "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", textAlign: "left", width: "100%" }}>
                      {selectedTicket.status === s ? <CheckCircle size={12} /> : <span style={{ width: 12 }} />}
                      {s.replace("_", " ")}
                    </button>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Details</p>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <div><span style={{ color: "var(--text-muted)" }}>Category:</span> {CATEGORY_OPTIONS[selectedTicket.category]}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Priority:</span> <span style={{ color: PRIORITY_COLORS[selectedTicket.priority], textTransform: "capitalize" }}>{selectedTicket.priority}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Store:</span> {selectedTicket.store?.name || "N/A"}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Created:</span> {new Date(selectedTicket.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.25rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LifeBuoy size={24} style={{ color: "var(--glow-purple)" }} /> Support Tickets
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Manage vendor support requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", padding: "0.25rem", background: "var(--bg-secondary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)" }}>
        {(["all", "open", "in_progress", "replied"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "none", background: filterStatus === s ? "var(--glow-purple)" : "transparent", color: filterStatus === s ? "white" : "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>
            {s === "all" ? `All (${ticketCounts.all})` : s === "in_progress" ? `In Progress (${ticketCounts.in_progress})` : `${s} (${ticketCounts[s as keyof typeof ticketCounts] || 0})`}
          </button>
        ))}
      </div>

      {/* Tickets */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading...</div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
            <LifeBuoy size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No tickets found</p>
          </div>
        ) : filteredTickets.map((ticket) => (
          <button key={ticket.id} onClick={() => openTicket(ticket)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", cursor: "pointer", textAlign: "left", width: "100%", transition: "border-color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--glow-purple)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: `${STATUS_COLORS[ticket.status]}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {ticket.status === "open" ? <AlertCircle size={16} style={{ color: STATUS_COLORS[ticket.status] }} /> : ticket.status === "replied" ? <MessageCircle size={16} style={{ color: STATUS_COLORS[ticket.status] }} /> : <CheckCircle size={16} style={{ color: STATUS_COLORS[ticket.status] }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                <User size={10} /> {ticket.store?.name || "Unknown"}
                <span>·</span> {CATEGORY_OPTIONS[ticket.category]}
                <span>·</span> <Clock size={10} /> {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}
              </div>
            </div>
            <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "1rem", background: `${PRIORITY_COLORS[ticket.priority]}15`, color: PRIORITY_COLORS[ticket.priority], border: `1px solid ${PRIORITY_COLORS[ticket.priority]}30`, textTransform: "capitalize", flexShrink: 0 }}>
              {ticket.priority}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
