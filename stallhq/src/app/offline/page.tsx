"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-6 fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--glow-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h.01" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /><path d="M5 12.859a10 10 0 0 1 5.17-2.69" /><path d="M13.83 10.17A10 10 0 0 1 19 12.86" /><path d="M2 8.82a15 15 0 0 1 4.17-2.65" /><path d="M22 8.82a15 15 0 0 0-4.17-2.65" /><path d="M12 2v2" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2">You&apos;re Offline</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Check your internet connection and try again.
          </p>
        </div>
        {isOnline ? (
          <Link href="/" className="glow-button inline-flex">
            Back to Home
          </Link>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="glow-button"
          >
            Retry
          </button>
        )}
      </div>
    </main>
  );
}
