export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8 fade-in">
        {/* Logo / Brand */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              stallHq
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
            Digital storefronts for WhatsApp
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="ambient-card p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Zero Cost</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              No hosting fees. Ever.
            </p>
          </div>
          <div className="ambient-card p-6">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold mb-2">Mobile First</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Built for African smartphones
            </p>
          </div>
          <div className="ambient-card p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold mb-2">WhatsApp Ready</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Orders go straight to your chat
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8 space-y-4">
          <a href="/dashboard" className="glow-button">
            Open Vendor Dashboard
          </a>
          <p className="text-sm text-[var(--text-muted)]">
            Try a demo store:{" "}
            <a
              href="/demo-store"
              className="text-[var(--glow-purple)] hover:underline"
            >
              /demo-store
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
