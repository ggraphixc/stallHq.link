import { Store } from "@/types";

interface StoreFooterProps {
  store: Store;
}

export function StoreFooter({ store }: StoreFooterProps) {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <span>Powered by</span>
            <span className="font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              stallHq
            </span>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
