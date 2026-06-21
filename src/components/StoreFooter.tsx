import { Store } from "@/types";

interface StoreFooterProps {
  store: Store;
}

export function StoreFooter({ store }: StoreFooterProps) {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-subtle)",
      marginTop: "3rem",
    }}>
      <div style={{
        maxWidth: "80rem",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          <span>Powered by</span>
          <span style={{ fontWeight: 700, background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>stallHq</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} {store.name}
        </p>
      </div>
    </footer>
  );
}
