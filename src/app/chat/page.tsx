"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createClient, REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import {
  MessageCircle, Send, ArrowLeft, Store, User, Search,
  CheckCheck, Check, Users,
} from "lucide-react";
import Link from "next/link";
import {
  upsertRealtimeMessage,
  mergeUpdatedMessage,
  mergeServerMessages,
  reconcileSentMessage,
  toggleReactionList,
} from "@/components/chat/messageMerge";
import { MessageActions, ReactionPills } from "@/components/chat/MessageActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
  reactions?: Record<string, string[]>;
}

interface Conversation {
  id: string;
  customer_id: string;
  vendor_id: string;
  store_id: string;
  store?: { id: string; name: string; slug: string; logo_url: string | null };
  last_message: string | null;
  last_message_at: string | null;
  unread_customer: number;
  unread_vendor: number;
  customer_email?: string;
  messages?: Message[];
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
          Loading messages…
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [rtStatus, setRtStatus] = useState<string>("connecting");
  const [openMsgId, setOpenMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openedStoreRef = useRef<string | null>(null);
  const dmChannelRef = useRef<RealtimeChannel | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId, loadConversations]);

  // /chat?store=<id> — create/find conversation and open it
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    try {
      const res = await fetch(`/api/chat?id=${conv.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveConv(data);
      }
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (!userId || !storeParam || openedStoreRef.current === storeParam) return;
    openedStoreRef.current = storeParam;
    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: storeParam }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.conversationId) return;
        const existing = conversations.find((c) => c.id === data.conversationId);
        if (existing) {
          await openConversation(existing);
        } else {
          await loadConversations();
          const created = await fetch(`/api/chat?id=${data.conversationId}`);
          if (created.ok) {
            const full = await created.json();
            setMessages(full.messages || []);
            setActiveConv(full);
          }
        }
      } catch {}
    })();
  }, [userId, storeParam, conversations, loadConversations, openConversation]);

  // Real-time subscription for messages + read receipts, with auto-resubscribe
  useEffect(() => {
    if (!activeConv) return;

    let cancelled = false;
    let retries = 0;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      setRtStatus("connecting");
      channel = supabase
        .channel(`chat-${activeConv.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        }, (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => upsertRealtimeMessage(prev, msg));
        })
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        }, (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => mergeUpdatedMessage(prev, msg));
        })
        .on("broadcast", { event: "dm-react" }, ({ payload }) => {
          const p = payload as { messageId?: string; emoji?: string; userId?: string };
          if (!p.messageId || !p.emoji || !p.userId) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === p.messageId
                ? { ...m, reactions: toggleReactionList(m.reactions, p.emoji!, p.userId!) }
                : m
            )
          );
        })
        .subscribe((status) => {
          if (cancelled) return;
          setRtStatus(status);
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            retries = 0;
          } else if (
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
            status === REALTIME_SUBSCRIBE_STATES.CLOSED
          ) {
            if (channel) {
              supabase.removeChannel(channel);
              channel = null;
            }
            if (dmChannelRef.current) dmChannelRef.current = null;
            const delay = Math.min(1000 * 2 ** retries, 15000);
            retries += 1;
            timer = setTimeout(connect, delay);
          }
        });
      dmChannelRef.current = channel;
    };

    connect();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
      dmChannelRef.current = null;
    };
  }, [activeConv?.id]);

  // Poll fallback when realtime is down (connecting/error/closed)
  useEffect(() => {
    if (!activeConv || rtStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) return;
    const id = activeConv.id;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => mergeServerMessages(prev, data.messages || []));
        }
      } catch {}
    }, 10000);
    return () => clearInterval(iv);
  }, [activeConv?.id, rtStatus]);

  // Real-time subscription for conversation list updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("chat-list")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, loadConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle an ephemeral DM reaction over the conversation channel
  const toggleDmReaction = (messageId: string, emoji: string) => {
    if (!userId) return;
    const channel = dmChannelRef.current;
    if (channel && rtStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
      void channel.send({
        type: "broadcast",
        event: "dm-react",
        payload: { messageId, emoji, userId },
      });
    }
    // self: false — apply locally; peers apply from the broadcast
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, reactions: toggleReactionList(m.reactions, emoji, userId) } : m
      )
    );
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: userId!,
      sender_role: activeConv.customer_id === userId ? "customer" : "vendor",
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, content }),
      });
      if (!res.ok) throw new Error("Failed");
      const { message } = await res.json();
      setMessages((prev) => reconcileSentMessage(prev, optimistic.id, message));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setNewMessage(content);
    }
    setSending(false);
  };

  // Filter conversations by search
  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.store?.name?.toLowerCase().includes(q) ||
      c.customer_email?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  });

  const [isVendor, setIsVendor] = useState(false);
  const unreadTotal = conversations.reduce((sum, c) => {
    if (c.customer_id === userId) return sum + c.unread_customer;
    if (c.vendor_id === userId) return sum + c.unread_vendor;
    return sum;
  }, 0);

  useEffect(() => {
    if (!userId || !supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("stores")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        if (!cancelled) setIsVendor(!!data);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
        <MessageCircle size={32} style={{ marginRight: 8 }} /> Sign in to access chat
      </div>
    );
  }

  return (
    <div className="chat-shell">
      {/* Conversation List */}
      <div className={`chat-list${activeConv ? " chat-list-hidden" : ""}`}>
        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Messages</h1>
              {unreadTotal > 0 && (
                <span style={{ fontSize: "0.6875rem", color: "var(--glow-purple)" }}>
                  {unreadTotal} unread
                </span>
              )}
            </div>
            <Link
              href="/community"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "0.75rem", fontWeight: 700, color: "var(--glow-purple)",
                textDecoration: "none", padding: "0.375rem 0.75rem",
                borderRadius: 999, border: "1px solid var(--border-glow)",
                background: "rgba(168,85,247,0.08)",
              }}
            >
              <Users size={13} /> Community
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="ambient-input"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              <MessageCircle size={28} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
              <p style={{ fontSize: "0.8125rem" }}>No conversations yet</p>
              <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {isVendor ? "Customers will message you from your store page" : "Message a vendor from their store page"}
              </p>
            </div>
          ) : filtered.map((conv) => {
            const unread = conv.customer_id === userId ? conv.unread_customer : conv.unread_vendor;
            const isActive = activeConv?.id === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => { void openConversation(conv); }}
                style={{
                  padding: "0.875rem 1.25rem", cursor: "pointer",
                  background: isActive ? "rgba(168,133,247,0.08)" : "transparent",
                  borderBottom: "1px solid var(--border-subtle)",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {conv.store?.logo_url ? (
                    <img src={conv.store.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, background: "var(--bg-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isVendor ? <User size={16} color="var(--text-muted)" /> : <Store size={16} color="var(--text-muted)" />}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        fontSize: "0.8125rem", fontWeight: unread > 0 ? 700 : 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {isVendor ? (conv.customer_email || "Customer") : (conv.store?.name || "Store")}
                      </span>
                      {conv.last_message_at && (
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      {unread > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, borderRadius: 9, background: "var(--glow-purple)",
                          color: "#fff", fontSize: "0.625rem", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {unread}
                        </span>
                      )}
                      <span style={{
                        fontSize: "0.75rem", color: unread > 0 ? "var(--text-secondary)" : "var(--text-muted)",
                        fontWeight: unread > 0 ? 500 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {conv.last_message || "No messages yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`chat-thread-pane${activeConv ? "" : " chat-pane-empty"}`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="chat-header-glass">
              <button
                onClick={() => setActiveConv(null)}
                className="chat-back-btn"
              >
                <ArrowLeft size={18} />
              </button>
              {activeConv.store?.logo_url ? (
                <img src={activeConv.store.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "var(--bg-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Store size={16} color="var(--text-muted)" />
                </div>
              )}
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {isVendor ? (activeConv.customer_email || "Customer") : (activeConv.store?.name || "Store")}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  {isVendor ? "Customer" : activeConv.store?.slug ? `stallhq.link/${activeConv.store.slug}` : ""}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-scroll">
              {messages.map((msg) => {
                const isMine = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`chat-row${isMine ? " chat-row-mine" : ""}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setOpenMsgId((prev) => (prev === msg.id ? null : msg.id));
                    }}
                  >
                    <div className={`chat-bubble${isMine ? " chat-bubble-mine" : ""}`}>
                      <ReactionPills
                        reactions={msg.reactions}
                        userId={userId}
                        onToggle={(emoji) => toggleDmReaction(msg.id, emoji)}
                      />
                      <div className="chat-bubble-text">{msg.content}</div>
                      <div className={`chat-bubble-meta${isMine ? " chat-bubble-meta-mine" : ""}`}>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && (msg.read_at ? (
                          <CheckCheck size={12} className="chat-read-tick" />
                        ) : (
                          <Check size={12} />
                        ))}
                      </div>
                      <MessageActions
                        open={openMsgId === msg.id}
                        onReact={(emoji) => toggleDmReaction(msg.id, emoji)}
                      />
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-composer">
              <div className="chat-composer-row">
                <textarea
                  ref={inputRef}
                  className="ambient-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1, resize: "none", fontSize: "0.8125rem",
                    padding: "0.625rem 0.875rem", borderRadius: "0.75rem",
                    maxHeight: 120, minHeight: 42, lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={`chat-send${newMessage.trim() && !sending ? " chat-send-ready" : ""}`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="chat-empty">
            <MessageCircle size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>Select a conversation</p>
            <p style={{ fontSize: "0.8125rem", marginTop: 4 }}>
              {isVendor ? "Customers who message your store will appear here" : "Start a conversation from a store page"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
