"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAlert } from "@/contexts/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { Mail, ArrowLeft, Save, RefreshCw } from "lucide-react";

interface EmailPreferences {
  weekly_analytics: boolean;
  monthly_analytics: boolean;
  trial_nurture: boolean;
  order_notifications: boolean;
  status_updates: boolean;
  low_stock_alerts: boolean;
  support_replies: boolean;
  marketing_tips: boolean;
}

const PREFERENCE_GROUPS = [
  {
    title: "Analytics & Reports",
    description: "Performance summaries for your store",
    preferences: [
      { key: "weekly_analytics" as const, label: "Weekly Analytics Summary", description: "Every Monday with growth trends, funnel, and best days" },
      { key: "monthly_analytics" as const, label: "Monthly Analytics Report", description: "1st of each month with month-over-month comparison" },
    ],
  },
  {
    title: "Orders & Inventory",
    description: "Notifications about your business operations",
    preferences: [
      { key: "order_notifications" as const, label: "New Order Alerts", description: "Get notified when a customer places an order" },
      { key: "status_updates" as const, label: "Order Status Updates", description: "When you update an order status" },
      { key: "low_stock_alerts" as const, label: "Low Stock Alerts", description: "When products are running low on stock" },
    ],
  },
  {
    title: "Support & Marketing",
    description: "Help and promotional content",
    preferences: [
      { key: "support_replies" as const, label: "Support Replies", description: "When our team responds to your support ticket" },
      { key: "marketing_tips" as const, label: "Marketing Tips & Offers", description: "Tips to grow your store and platform updates" },
    ],
  },
];

export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error: showError, success: showSuccess } = useAlert();
  const { logo_url, platform_name } = useBranding();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/email-preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: keyof EmailPreferences) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const savePreferences = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        showSuccess("Email preferences saved");
      } else {
        showError("Failed to save preferences");
      }
    } catch {
      showError("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none",
              marginBottom: "1rem",
            }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
              background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Mail size={18} style={{ color: "white" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Email Preferences</h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Control which emails you receive</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
          </div>
        ) : !preferences ? (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            borderRadius: "0.875rem", padding: "2rem", textAlign: "center",
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Could not load preferences. Please try again.
            </p>
          </div>
        ) : (
          <>
            {PREFERENCE_GROUPS.map((group) => (
              <div
                key={group.title}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                  borderRadius: "0.875rem", padding: "1.25rem", marginBottom: "1rem",
                }}
              >
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {group.title}
                </h3>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  {group.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {group.preferences.map((pref) => (
                    <div
                      key={pref.key}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.75rem", borderRadius: "0.5rem",
                        background: "var(--bg-secondary)", cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onClick={() => togglePreference(pref.key)}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{pref.label}</p>
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                          {pref.description}
                        </p>
                      </div>
                      <div
                        style={{
                          width: "2.5rem", height: "1.375rem", borderRadius: "0.6875rem",
                          background: preferences[pref.key] ? "var(--glow-green)" : "var(--bg-elevated)",
                          border: `1px solid ${preferences[pref.key] ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                          position: "relative", transition: "all 0.2s", flexShrink: 0, marginLeft: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "1rem", height: "1rem", borderRadius: "50%",
                            background: "white", position: "absolute", top: "1px",
                            left: preferences[pref.key] ? "calc(100% - 1.125rem)" : "1px",
                            transition: "left 0.2s",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save button */}
            <button
              onClick={savePreferences}
              disabled={saving}
              className="glow-button"
              style={{
                width: "100%", padding: "0.875rem", fontSize: "0.875rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}
            >
              {saving ? (
                <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Preferences"}
            </button>

            <p style={{
              fontSize: "0.625rem", color: "var(--text-muted)", textAlign: "center",
              marginTop: "1rem", lineHeight: 1.5,
            }}>
              Order notifications and support replies are essential for your business.
              You can disable marketing emails but will still receive critical order alerts.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
