"use client";

import { Reply } from "lucide-react";

interface MessageActionsProps {
  open?: boolean;
  onReact: (emoji: string) => void;
  onReply?: () => void;
}

export function MessageActions({ open, onReact, onReply }: MessageActionsProps) {
  return (
    <div
      className={`chat-msg-actions${open ? " chat-msg-actions-open" : ""}`}
      role="toolbar"
      aria-label="Message actions"
    >
      <button
        type="button"
        className="chat-action-btn"
        aria-label="React with thumbs up"
        onClick={() => onReact("👍")}
      >
        👍
      </button>
      <button
        type="button"
        className="chat-action-btn"
        aria-label="React with heart"
        onClick={() => onReact("❤️")}
      >
        ❤️
      </button>
      {onReply && (
        <button
          type="button"
          className="chat-action-btn"
          aria-label="Reply"
          onClick={onReply}
        >
          <Reply size={12} />
        </button>
      )}
    </div>
  );
}

interface ReactionPillsProps {
  reactions?: Record<string, string[]> | null;
  userId?: string | null;
  onToggle?: (emoji: string) => void;
}

export function ReactionPills({ reactions, userId, onToggle }: ReactionPillsProps) {
  const entries = Object.entries(reactions || {}).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="chat-reactions">
      {entries.map(([emoji, users]) => {
        const mine = !!userId && users.includes(userId);
        const className = `chat-reaction-pill${mine ? " chat-reaction-pill-mine" : ""}`;
        const body = (
          <>
            <span aria-hidden="true">{emoji}</span>
            <span>{users.length}</span>
          </>
        );
        if (!onToggle) {
          return (
            <span key={emoji} className={className}>
              {body}
            </span>
          );
        }
        return (
          <button
            key={emoji}
            type="button"
            className={className}
            onClick={() => onToggle(emoji)}
            aria-label={`${users.length} reaction${users.length === 1 ? "" : "s"} ${emoji}`}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
