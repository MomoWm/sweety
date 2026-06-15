const PERKS = [
  "Unlimited cinematic presentations",
  "Save unlimited homeowners, synced everywhere",
  "Branded one-page proposals",
  "Everything you build, kept forever",
];

interface Props {
  onClose: () => void;
  onSubscribe: () => void;
  busy?: boolean;
  error?: string;
}

/** The paywall — shown after a free account uses its 3 presentations. */
export function UpgradeModal({ onClose, onSubscribe, busy, error }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="card reveal relative w-full max-w-sm rounded-3xl p-7 text-center sm:p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-slate2 transition hover:text-graphite">
          ✕
        </button>

        <div className="text-3xl" aria-hidden>☀️</div>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-graphite">
          You're out of free presentations this month
        </h2>
        <p className="mt-1 text-sm text-slate2">
          Go unlimited and keep closing — it pays for itself on your first deal.
        </p>

        <div className="mt-5 rounded-2xl border border-gold/40 bg-gold/[0.06] p-5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold tracking-tight text-graphite">$21.95</span>
            <span className="text-sm text-slate2">/month</span>
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ember">
            7-day free trial · cancel anytime
          </div>
        </div>

        <ul className="mt-5 space-y-2 text-left">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-graphite">
              <span className="mt-0.5 text-emerald-600">✓</span>
              {p}
            </li>
          ))}
        </ul>

        {error && <div role="alert" className="mt-4 text-sm text-ember">{error}</div>}

        <button
          onClick={onSubscribe}
          disabled={busy}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-gold to-ember px-6 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {busy ? "Taking you to checkout…" : "Start my 7-day free trial"}
        </button>
        <button onClick={onClose} className="mt-3 w-full text-sm font-medium text-slate2 transition hover:text-graphite">
          Maybe later
        </button>
      </div>
    </div>
  );
}
