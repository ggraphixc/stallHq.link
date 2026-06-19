import Link from "next/link";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Zero Cost",
    description: "No hosting fees, no hidden charges. Your store runs on free infrastructure forever.",
    accent: "green" as const,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--glow-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
      </svg>
    ),
    title: "Mobile First",
    description: "Built for thumb-scrolling on African smartphones. Fast, light, always accessible.",
    accent: "purple" as const,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--glow-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "WhatsApp Orders",
    description: "Customers tap checkout, message goes straight to your WhatsApp. No app needed.",
    accent: "cyan" as const,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--glow-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9Z" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9Z" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    title: "QR Code Ready",
    description: "Generate a QR code for your store. Print it, share it, get orders.",
    accent: "amber" as const,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--glow-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: "Order Tracking",
    description: "Track every order from pending to delivered. Know your business, always.",
    accent: "purple" as const,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Instant Setup",
    description: "Create your store in under 60 seconds. Add products, connect WhatsApp, go live.",
    accent: "green" as const,
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Store",
    description: "Pick a name, add your WhatsApp number. Takes 30 seconds.",
    color: "var(--glow-purple)",
  },
  {
    number: "02",
    title: "Add Products",
    description: "Upload photos, set prices, add descriptions. Or batch upload via CSV.",
    color: "var(--glow-cyan)",
  },
  {
    number: "03",
    title: "Share & Sell",
    description: "Share your link or QR code. Orders land in your WhatsApp instantly.",
    color: "var(--glow-green)",
  },
];

const accentMap = {
  green: { bg: "var(--glow-green-dim)", border: "rgba(16,185,129,0.2)" },
  purple: { bg: "var(--glow-purple-dim)", border: "rgba(168,85,247,0.2)" },
  cyan: { bg: "var(--glow-cyan-dim)", border: "rgba(6,182,212,0.2)" },
  amber: { bg: "var(--glow-amber-dim)", border: "rgba(245,158,11,0.2)" },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 sm:px-10 md:px-16 text-center overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--glow-purple)] rounded-full opacity-[0.04] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--glow-cyan)] rounded-full opacity-[0.03] blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--glow-green)] rounded-full opacity-[0.02] blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-8 fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-sm text-xs text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--glow-green)] animate-pulse" />
              Free forever. No credit card. No catch.
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
              Your WhatsApp.
              <br />
              <span className="text-gradient">Your Store.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
              Turn your WhatsApp into a powerful digital storefront. Zero hosting costs, instant setup, orders delivered straight to your chat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="glow-button text-base px-8 py-4">
              Open Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link href="/demo-store" className="glow-button-secondary text-base px-8 py-4">
              View Demo Store
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-8 pt-6 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span>Zero hosting</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span>60s setup</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span>WhatsApp native</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="page-container section-gap">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto">Three steps from idea to live storefront.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative group">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-[var(--border-medium)] to-transparent z-0" />
              )}
              <div className="relative z-10 ambient-card p-8 sm:p-10 text-center group-hover:border-[var(--border-glow)] transition-all duration-400">
                <div className="text-5xl font-extrabold mb-5 opacity-10 group-hover:opacity-20 transition-opacity" style={{ color: step.color }}>
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="page-container section-gap">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto">Built specifically for WhatsApp-based businesses in Africa.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {features.map((feature) => {
            const a = accentMap[feature.accent];
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/40 backdrop-blur-xl p-7 sm:p-8 transition-all duration-400 hover:border-[var(--border-glow)] hover:bg-[var(--bg-card)]/60"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                    style={{ background: a.bg, border: `1px solid ${a.border}` }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-3">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="page-container section-gap">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/40 backdrop-blur-xl p-12 sm:p-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--glow-purple)]/5 via-transparent to-[var(--glow-cyan)]/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--glow-purple)] rounded-full opacity-[0.06] blur-[120px] pointer-events-none" />
          <div className="relative z-10 max-w-lg mx-auto space-y-6">
            <p className="text-5xl sm:text-6xl font-extrabold">100%</p>
            <p className="text-lg text-[var(--text-secondary)]">Free forever. No catches. Start selling in 60 seconds.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard" className="glow-button px-8 py-4 text-base">
                Start Selling Now
              </Link>
              <Link href="/explore" className="glow-button-secondary px-8 py-4 text-base">
                Browse Stores
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-container py-12 border-t border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            Built for WhatsApp vendors across Africa.
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/explore" className="hover:text-[var(--text-primary)] transition-colors">Explore</Link>
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
