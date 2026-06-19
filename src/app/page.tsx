import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-5 sm:px-8 text-center">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--glow-purple)] rounded-full opacity-[0.04] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--glow-cyan)] rounded-full opacity-[0.03] blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-8 fade-in">
          {/* Brand */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--glow-green)] animate-pulse" />
              Free forever. No credit card.
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Your WhatsApp.
              <br />
              <span className="text-gradient">Your Store.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
              Turn your WhatsApp into a powerful digital storefront. Zero hosting costs, instant setup, orders delivered straight to your chat.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="glow-button text-base px-8 py-3.5">
              Open Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link href="/demo-store" className="glow-button-secondary text-base px-8 py-3.5">
              View Demo Store
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container section-gap">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              title: "Zero Cost",
              description: "No hosting fees, no hidden charges. Your store runs on free infrastructure forever.",
              accent: "green" as const,
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--glow-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
                </svg>
              ),
              title: "Mobile First",
              description: "Built for thumb-scrolling on African smartphones. Fast, light, always accessible.",
              accent: "purple" as const,
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--glow-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "WhatsApp Orders",
              description: "Customers tap checkout, message goes straight to your WhatsApp. No app needed.",
              accent: "cyan" as const,
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--glow-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9Z" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9Z" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              ),
              title: "QR Code Ready",
              description: "Generate a QR code for your store. Print it, share it, get orders.",
              accent: "amber" as const,
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--glow-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                </svg>
              ),
              title: "Order Tracking",
              description: "Track every order from pending to delivered. Know your business, always.",
              accent: "purple" as const,
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--glow-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              ),
              title: "Instant Setup",
              description: "Create your store in under 60 seconds. Add products, connect WhatsApp, go live.",
              accent: "green" as const,
            },
          ].map((feature) => (
            <div key={feature.title} className="ambient-card ambient-card-interactive p-6 sm:p-7">
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `var(--glow-${feature.accent}-dim)` }}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="page-container section-gap">
        <div className="glass-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <p className="text-4xl sm:text-5xl font-extrabold mb-3">100%</p>
          <p className="text-lg text-[var(--text-secondary)] mb-8">Free forever. No catches.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="glow-button px-8">
              Start Selling Now
            </Link>
            <Link href="/explore" className="glow-button-secondary px-8">
              Browse Stores
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-container py-10 border-t border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            Built for WhatsApp vendors across Africa.
          </p>
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <Link href="/explore" className="hover:text-[var(--text-primary)] transition-colors">Explore</Link>
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
