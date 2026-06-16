interface Props {
  /** Load the sample bill and dive straight into the results. */
  onTrySample: () => void;
  /** Dismiss and let them use their own bill. */
  onClose: () => void;
}

const STEPS = [
  { n: "1", t: "Drop the bill", d: "Any electric bill — a PDF or a photo. It reads right on your device." },
  { n: "2", t: "Set the solar price", d: "Type the monthly price from your quote." },
  { n: "3", t: "Present", d: "A cinematic 25-year savings story, ready to show." },
];

/** First-visit greeting — orients a brand-new user and offers the
 *  zero-friction path: try it instantly with a sample bill. */
export function Welcome({ onTrySample, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Welcome to SunLedger">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="card reveal relative w-full max-w-md rounded-3xl p-7 text-center sm:p-8">
        <div className="text-5xl" aria-hidden>👋</div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-graphite">
          Welcome to Sun<span className="accent-text">Ledger</span>
        </h2>
        <p className="mt-2 text-slate2">
          Turn any electric bill into a 25-year solar savings story — in about
          30 seconds, right on this device.
        </p>

        <div className="mt-6 space-y-3 text-left">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-ember text-sm font-bold text-white">
                {s.n}
              </div>
              <div>
                <div className="text-sm font-semibold text-graphite">{s.t}</div>
                <div className="text-xs text-slate2">{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onTrySample}
          className="mt-7 w-full rounded-full bg-gradient-to-r from-gold to-ember px-6 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-95"
        >
          ✨ Try it with a sample bill
        </button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-sm font-medium text-slate2 transition hover:text-graphite"
        >
          I've got my own bill →
        </button>

        <div className="mt-5 text-[11px] text-slate2">
          🔒 100% on this device · nothing leaves your phone
        </div>
      </div>
    </div>
  );
}
