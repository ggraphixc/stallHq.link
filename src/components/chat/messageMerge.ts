export interface ChatMessageLike {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function isTempId(id: string): boolean {
  return id.startsWith("temp-");
}

function isOptimisticTwin(a: ChatMessageLike, b: ChatMessageLike): boolean {
  return isTempId(a.id) && a.sender_id === b.sender_id && a.content === b.content;
}

function byCreatedAt(a: ChatMessageLike, b: ChatMessageLike): number {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

export function upsertRealtimeMessage<T extends ChatMessageLike>(prev: T[], incoming: T): T[] {
  const existing = prev.findIndex((m) => m.id === incoming.id);
  if (existing !== -1) {
    const next = [...prev];
    next[existing] = { ...next[existing], ...incoming };
    return next;
  }
  const twin = prev.findIndex((m) => isOptimisticTwin(m, incoming));
  if (twin !== -1) {
    const next = [...prev];
    next[twin] = incoming;
    return next;
  }
  return [...prev, incoming];
}

export function mergeUpdatedMessage<T extends ChatMessageLike>(prev: T[], incoming: T): T[] {
  const existing = prev.findIndex((m) => m.id === incoming.id);
  if (existing === -1) return [...prev, incoming];
  const next = [...prev];
  next[existing] = { ...next[existing], ...incoming };
  return next;
}

export function reconcileSentMessage<T extends ChatMessageLike>(
  prev: T[],
  optimisticId: string,
  message: T
): T[] {
  const hasReal = prev.some((m) => m.id === message.id);
  if (hasReal) {
    return prev
      .filter((m) => m.id !== optimisticId)
      .map((m) => (m.id === message.id ? { ...m, ...message } : m));
  }
  const idx = prev.findIndex((m) => m.id === optimisticId);
  if (idx !== -1) {
    const next = [...prev];
    next[idx] = message;
    return next;
  }
  return [...prev, message];
}

export function mergeServerMessages<T extends ChatMessageLike>(prev: T[], incoming: T[]): T[] {
  let next = prev;
  for (const msg of incoming) {
    next = upsertRealtimeMessage(next, msg);
  }
  return [...next].sort(byCreatedAt);
}

export function toggleReactionList(
  reactions: Record<string, string[]> | null | undefined,
  emoji: string,
  userId: string
): Record<string, string[]> {
  const next: Record<string, string[]> = { ...(reactions || {}) };
  const list = [...(next[emoji] || [])];
  const at = list.indexOf(userId);
  if (at >= 0) list.splice(at, 1);
  else list.push(userId);
  if (list.length) next[emoji] = list;
  else delete next[emoji];
  return next;
}

export function toggleReactionInMetadata<T extends { reactions?: Record<string, string[]> } | null | undefined>(
  metadata: T,
  emoji: string,
  userId: string
): T {
  const base = (metadata || {}) as { reactions?: Record<string, string[]> };
  return {
    ...(base as object),
    reactions: toggleReactionList(base.reactions, emoji, userId),
  } as T;
}
