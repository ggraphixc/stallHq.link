import { Store } from "lucide-react";

/**
 * stallHq branded loader — an ambient full-screen (or inline) loading state:
 * rotating conic ring, pulsing gradient mark, shimmering wordmark.
 * Self-contained (no external CSS / hooks) so it can render in RSC too.
 */
export function Loader({
  label = "Loading…",
  inline = false,
}: {
  label?: string;
  inline?: boolean;
}) {
  return (
    <div
      className={inline ? "shq-ldr shq-ldr-inline" : "shq-ldr"}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <style>{`
        .shq-ldr{
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem;
          background: radial-gradient(1200px 600px at 20% -10%, rgba(168,85,247,0.08), transparent 60%),
                      radial-gradient(1000px 500px at 110% 110%, rgba(6,182,212,0.07), transparent 60%),
                      #06060b;
        }
        .shq-ldr-inline{ position: relative; inset: auto; min-height: 240px; border-radius: 1rem;
          background: radial-gradient(500px 300px at 50% 0%, rgba(168,85,247,0.06), transparent 70%), transparent;
        }
        .shq-ldr-wrap{ position: relative; width: 116px; height: 116px; }
        .shq-ldr-ring{
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.08) 10%, #a855f7 24%, #22d3ee 42%, transparent 58%, transparent 100%);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px));
          animation: shq-spin 1.1s linear infinite;
          filter: drop-shadow(0 0 18px rgba(168,85,247,0.35));
        }
        .shq-ldr-mark{
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 58px; height: 58px; border-radius: 17px;
          background: linear-gradient(135deg, #a855f7, #7c3aed 45%, #06b6d4);
          display: flex; align-items: center; justify-content: center; color: #fff;
          box-shadow: 0 0 0 6px rgba(168,85,247,0.08), 0 12px 40px rgba(168,85,247,0.35);
          animation: shq-pulse 1.6s ease-in-out infinite;
        }
        .shq-ldr-wordmark{
          font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1;
          background: linear-gradient(90deg, #f8fafc 0%, #f8fafc 30%, #a855f7 50%, #22d3ee 55%, #f8fafc 75%);
          background-size: 220% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: shq-shimmer 2.2s linear infinite;
        }
        .shq-ldr-dots{ display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: -0.5rem; }
        .shq-ldr-dot{ width: 7px; height: 7px; border-radius: 50%; animation: shq-bounce 1.2s ease-in-out infinite; }
        .shq-ldr-dot:nth-child(1){ background: #a855f7; }
        .shq-ldr-dot:nth-child(2){ background: #22d3ee; animation-delay: 0.15s; }
        .shq-ldr-dot:nth-child(3){ background: #10b981; animation-delay: 0.3s; }
        .shq-ldr-label{
          font-size: 0.7rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(148,163,184,0.75); margin-top: -0.25rem;
        }
        @keyframes shq-spin { to { transform: rotate(360deg); } }
        @keyframes shq-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 6px rgba(168,85,247,0.08), 0 12px 40px rgba(168,85,247,0.35); }
          50% { transform: translate(-50%, -50%) scale(1.07); box-shadow: 0 0 0 12px rgba(168,85,247,0.04), 0 16px 56px rgba(168,85,247,0.5); }
        }
        @keyframes shq-shimmer { to { background-position: -220% 0; } }
        @keyframes shq-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce){
          .shq-ldr-ring, .shq-ldr-mark, .shq-ldr-wordmark, .shq-ldr-dot{ animation: none; }
        }
      `}</style>

      <div className="shq-ldr-wrap">
        <div className="shq-ldr-ring" />
        <div className="shq-ldr-mark">
          <Store size={26} strokeWidth={2.2} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem" }}>
        <span className="shq-ldr-wordmark">stallHq</span>
        <div className="shq-ldr-dots">
          <span className="shq-ldr-dot" />
          <span className="shq-ldr-dot" />
          <span className="shq-ldr-dot" />
        </div>
        <span className="shq-ldr-label">{label}</span>
      </div>
    </div>
  );
}
