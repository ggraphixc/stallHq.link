"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, MessageCircle, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StoreAssistantProps {
  storeSlug: string;
  storeName: string;
}

/**
 * Floating "Ask AI" chat widget for public storefronts.
 * Talks to /api/ai/assistant which is grounded in the store's real products.
 */
export function StoreAssistant({ storeSlug, storeName }: StoreAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug, message: content, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e?.message || "Could not reach the assistant. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Ask store assistant"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "1.5rem",
          zIndex: 60,
          width: "3.25rem",
          height: "3.25rem",
          borderRadius: "9999px",
          border: "1px solid rgba(168,133,247,0.4)",
          background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(168,133,247,0.35)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {open ? <X size={18} /> : <Bot size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "5.25rem",
            left: "1.5rem",
            zIndex: 60,
            width: "min(22rem, calc(100vw - 2rem))",
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            overflow: "hidden",
            animation: "slide-up 0.25s ease",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "0.875rem 1rem",
            background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
          }}>
            <div style={{
              width: "2rem", height: "2rem", borderRadius: "0.5rem",
              background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Bot size={14} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, margin: 0 }}>{storeName} Assistant</p>
              <p style={{ fontSize: "0.625rem", color: "var(--glow-green)", margin: 0, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--glow-green)", display: "inline-block" }} />
                AI — knows our catalog
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {messages.length === 0 && (
              <div style={{ padding: "0.25rem 0.125rem 0.5rem" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  👋 Hi! Ask me anything about {storeName} — what we sell, prices, or what's in stock.
                </p>
                {[
                  "What do you sell?",
                  "Do you have anything under ₦5,000?",
                  "What's your best product?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", marginBottom: "0.375rem",
                      padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--glow-purple)",
                      background: "rgba(168,133,247,0.08)", border: "1px solid rgba(168,133,247,0.2)",
                      borderRadius: "0.5rem", cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  borderRadius: "0.75rem",
                  background: m.role === "user" ? "var(--glow-purple)" : "rgba(255,255,255,0.05)",
                  color: m.role === "user" ? "white" : "var(--text-primary)",
                  borderBottomRightRadius: m.role === "user" ? "0.25rem" : "0.75rem",
                  borderBottomLeftRadius: m.role === "user" ? "0.75rem" : "0.25rem",
                }}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Thinking…
              </div>
            )}

            {error && (
              <div style={{ fontSize: "0.6875rem", color: "var(--glow-red)", padding: "0.25rem 0.125rem" }}>
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            style={{
              display: "flex", gap: "0.5rem", padding: "0.75rem",
              borderTop: "1px solid var(--border-subtle)", background: "var(--bg-primary)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${storeName}…`}
              style={{
                flex: 1, padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
                background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={{
                width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", border: "none",
                background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
                color: "white", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
