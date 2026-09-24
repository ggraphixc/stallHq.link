"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Store as StoreIcon,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_vendor: boolean;
  joined_at: string | null;
  review_count: number;
  stores: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    verified: boolean;
    category: string | null;
    created_at: string;
  }[];
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "0.75rem",
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profiles/${id}`);
        if (!res.ok) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProfile(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const initials = (profile?.display_name || "?")
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              border: "2px solid var(--border-subtle)",
              borderTopColor: "var(--glow-purple)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <main
          style={{
            maxWidth: "40rem",
            margin: "0 auto",
            padding: "4rem 1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <StoreIcon size={24} style={{ color: "var(--glow-purple)" }} />
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Profile not found
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            This member may have removed their account.
          </p>
          <Link
            href="/explore"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              background: "var(--glow-purple)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore Stores
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(var(--bg-primary),0.8)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "0 1rem",
            height: "3.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} style={{ color: "var(--text-muted)" }} />
          </Link>
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            Profile
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ ...glassCard, padding: "clamp(1.25rem, 4vw, 1.75rem)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                style={{
                  width: "4.5rem",
                  height: "4.5rem",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--bg-card)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "4.5rem",
                  height: "4.5rem",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "white",
                  border: "2px solid var(--bg-card)",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <h1
                  style={{
                    fontSize: "clamp(1.125rem, 4vw, 1.5rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.2,
                  }}
                >
                  {profile.display_name}
                </h1>
                {profile.is_vendor && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                      background: "rgba(16,185,129,0.12)",
                      color: "var(--glow-green)",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    <ShieldCheck size={10} />
                    Vendor
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                  flexWrap: "wrap",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                {profile.joined_at && (
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <Calendar size={12} />
                    Joined{" "}
                    {new Date(profile.joined_at).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <MessageSquare size={12} />
                  {profile.review_count} review{profile.review_count === 1 ? "" : "s"}
                </span>
              </div>

              {profile.bio && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.75rem",
                    lineHeight: 1.6,
                  }}
                >
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            ...glassCard,
            padding: "1.25rem",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              ...sectionLabel,
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <StoreIcon size={12} />
            {profile.is_vendor
              ? profile.stores.length === 1
                ? "Store"
                : "Stores"
              : "Stores"}
          </div>

          {profile.stores.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              No public stores yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {profile.stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "rgba(168,133,247,0.06)",
                    border: "1px solid rgba(168,133,247,0.15)",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.background = "rgba(168,133,247,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.background = "rgba(168,133,247,0.06)";
                  }}
                >
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "0.5rem",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "0.5rem",
                        background:
                          "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <StoreIcon size={14} style={{ color: "white" }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      {store.name}
                      {store.verified && (
                        <ShieldCheck
                          size={12}
                          style={{ color: "var(--glow-green)", flexShrink: 0 }}
                        />
                      )}
                    </p>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      /{store.slug}
                      {store.category ? ` · ${store.category}` : ""}
                    </p>
                  </div>
                  <ExternalLink
                    size={14}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
