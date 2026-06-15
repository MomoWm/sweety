import { useEffect, useRef, useState } from "react";

interface Props {
  /** Enter the app / start the free tier. */
  onStart: () => void;
  /** Load the sample bill for a live demo. */
  onDemo: () => void;
  /** Open the sign-in modal. */
  onLogin: () => void;
  /** Set when a homeowner arrives via a rep's shareable link. */
  rep?: { full_name: string | null; company: string | null; phone: string | null; headshot_url: string | null } | null;
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">☀️</span>
      <span className="text-xl font-bold tracking-tight text-graphite">
        Sun<span className="accent-text">Ledger</span>
      </span>
    </div>
  );
}

const PROBLEMS = [
  { icon: "✍️", title: "Fumbled savings math", body: "Scribbling numbers on paper or tabbing through a clunky spreadsheet kills your momentum — and their trust." },
  { icon: "🥱", title: "Forgettable pitches", body: "A plain PDF never makes a homeowner feel the 25-year cost of doing nothing. No feeling, no urgency." },
  { icon: "👥", title: "You look like everyone else", body: "Homeowners collect three quotes. The rep who shows the clearest story is the one who walks out signed." },
];

const STEPS = [
  { n: "1", title: "Upload the bill", body: "Snap a photo or drop the PDF. SunLedger reads the usage and rate right on your phone — in seconds." },
  { n: "2", title: "Instant 25-year story", body: "Watch their utility cost climb vs. a locked-in solar rate. Real numbers, zero spreadsheet." },
  { n: "3", title: "Present like a pro", body: "One tap launches a full-screen, cinematic pitch that makes the savings impossible to ignore." },
];

const FEATURES = [
  { icon: "🧾", title: "Reads real bills", body: "Tuned for 15+ utilities — Eversource, PSE&G, National Grid, PG&E and more. PDFs or photos." },
  { icon: "🔒", title: "On-device & private", body: "The bill never leaves the phone. Earn the homeowner's trust the moment you open it." },
  { icon: "🎬", title: "Cinematic Presentation", body: "A six-slide pitch with a jaw-dropping catch-up animation that lands the urgency." },
  { icon: "📈", title: "Defensible 25-yr math", body: "Customizable escalators, offset, and a transparent breakdown you can stand behind." },
  { icon: "📄", title: "Branded proposal", body: "Leave them a polished one-page proposal — printed straight from your phone." },
  { icon: "💾", title: "Your pipeline, saved", body: "Every homeowner you run is kept and synced across all your devices." },
];

const PRICE_INCLUDES = [
  "Unlimited cinematic presentations",
  "Reads any supported utility bill",
  "25-year savings story + breakdown",
  "Branded one-page proposals",
  "Saved, synced homeowner pipeline",
  "Break-even timeline & ROI tools",
];

const FAQS = [
  { q: "Do I need to be techy to use it?", a: "No. Upload a bill, type the solar price, tap Present. If you can text, you can run SunLedger." },
  { q: "Which utilities does it work with?", a: "It's tuned for 15+ major utilities including Eversource, United Illuminating, PSE&G, National Grid, Con Edison, PG&E and more — and you can always type the numbers in by hand." },
  { q: "Is my customer's bill data safe?", a: "Yes. The bill is read entirely on your device — it never gets uploaded to a server. That's also a great trust-builder at the table." },
  { q: "What's included in the free tier?", a: "Your first 3 full presentations are free. After that it's $21.95/month per rep, with a 7-day free trial." },
  { q: "Does it work on iPhone and iPad?", a: "Yes — it's built for exactly that. Run it at the kitchen table on the device in your pocket." },
  { q: "Can I cancel anytime?", a: "Anytime, in a couple of taps. The 7-day trial means you can try the full tool before you're charged a cent." },
];

const PROOF_POINTS = [
  { value: "15+", label: "Utilities supported" },
  { value: "100%", label: "On-device — no servers" },
  { value: "$0", label: "API fees, ever" },
  { value: "60s", label: "Bill to pitch-ready" },
];

/** Marketing landing page — sells SunLedger to residential solar reps. */
export function LandingPage({ onStart, onDemo, onLogin, rep }: Props) {
  const hasRep = !!(rep && (rep.full_name || rep.company));
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="relative z-10">
      {hasRep && (
        <div className="flex items-center justify-center gap-3 bg-ink px-4 py-2.5 text-center text-sm text-white">
          {rep?.headshot_url && <img src={rep.headshot_url} alt="" className="h-7 w-7 rounded-full object-cover" />}
          <span>
            Brought to you by <span className="font-bold">{rep?.full_name || rep?.company}</span>
            {rep?.phone ? <span className="text-white/70"> · {rep.phone}</span> : null}
          </span>
        </div>
      )}

      {/* Sticky header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 print:hidden ${
          scrolled
            ? "bg-snow/90 backdrop-blur-xl border-b border-hair shadow-card"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate2 transition hover:text-graphite sm:block">
              Log in
            </button>
            <button onClick={onStart} className="rounded-full bg-gradient-to-r from-gold to-ember px-4 py-2 text-sm font-bold text-white shadow-glow transition active:scale-95">
              Start free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative px-5 pt-28 text-center sm:px-8 sm:pt-36">
        <div className="sun-soft" aria-hidden />
        <div className="relative mx-auto max-w-3xl reveal">
          <div className="mb-5 inline-block rounded-full border border-hair bg-snow/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate2">
            Built for residential solar reps
          </div>
          <h1 className="tight text-4xl font-bold leading-[1.05] text-graphite sm:text-6xl lg:text-7xl">
            Turn any electric bill into a{" "}
            <span className="accent-text">closing-ready pitch</span> in 60 seconds.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate2 sm:text-xl">
            SunLedger reads your customer's bill right on your phone and turns it into a
            25-year savings story — while you're sitting at their kitchen table.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={onStart} className="w-full rounded-full bg-gradient-to-r from-gold to-ember px-8 py-4 text-base font-bold text-white shadow-glow transition active:scale-95 sm:w-auto">
              Start free — 3 presentations on us →
            </button>
            <button onClick={onDemo} className="w-full rounded-full border border-hair bg-snow px-8 py-4 text-base font-semibold text-graphite transition hover:border-gold active:scale-95 sm:w-auto">
              ▶ See it live
            </button>
          </div>
          <div className="mt-5 text-sm text-slate2">
            100% on your device · works with 15+ utilities · iPhone &amp; iPad
          </div>
        </div>
      </section>

      {/* Live proof points */}
      <section className="mx-auto mt-16 max-w-4xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PROOF_POINTS.map((p) => (
            <div key={p.label} className="card reveal rounded-2xl p-4 text-center sm:rounded-3xl sm:p-6">
              <div className="accent-text text-3xl font-black tracking-tight sm:text-4xl">{p.value}</div>
              <div className="mt-1 text-xs font-medium text-slate2">{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center reveal">
          <div className="text-xs font-bold uppercase tracking-widest text-ember">The problem</div>
          <h2 className="tight mt-3 text-3xl font-bold text-graphite sm:text-4xl">
            Deals die in the awkward silence while you do math.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="card reveal rounded-3xl p-6">
              <div className="text-3xl">{p.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-graphite">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate2">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center reveal">
          <div className="text-xs font-bold uppercase tracking-widest text-gold">How it works</div>
          <h2 className="tight mt-3 text-3xl font-bold text-graphite sm:text-4xl">
            Bill to closing-ready in three taps.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="card reveal rounded-3xl p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold to-ember text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-bold text-graphite">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate2">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center reveal">
          <div className="text-xs font-bold uppercase tracking-widest text-gold">Why reps love it</div>
          <h2 className="tight mt-3 text-3xl font-bold text-graphite sm:text-4xl">
            Everything you need to close at the table.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card reveal rounded-3xl p-6">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 text-base font-bold text-graphite">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical credibility */}
      <section className="mx-auto mt-24 max-w-3xl px-5 sm:px-8">
        <div className="card reveal rounded-3xl p-7 sm:p-9">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">How it stays free</div>
          <h2 className="tight text-2xl font-bold text-graphite sm:text-3xl">No API. No servers. No cost.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate2">
            SunLedger uses pdf.js to extract text from PDFs and Tesseract.js to OCR photo bills — both run entirely
            in the browser. There's no LLM call, no cloud upload, no API key to buy. The bill stays on your device.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { t: "PDF text", d: "pdf.js" },
              { t: "Photo bills", d: "Tesseract.js OCR" },
              { t: "Charts", d: "Recharts" },
              { t: "Hosting", d: "Free static tier" },
            ].map((r) => (
              <div key={r.t} className="rounded-2xl border border-hair bg-cloud p-3 text-center">
                <div className="text-sm font-bold text-graphite">{r.t}</div>
                <div className="mt-0.5 text-xs text-slate2">{r.d}</div>
                <div className="mt-1 text-[11px] font-bold text-emerald-600">$0</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto mt-24 max-w-3xl px-5 sm:px-8">
        <div className="text-center reveal">
          <div className="text-xs font-bold uppercase tracking-widest text-gold">Pricing</div>
          <h2 className="tight mt-3 text-3xl font-bold text-graphite sm:text-4xl">
            One plan. Pays for itself on your first deal.
          </h2>
        </div>
        <div className="card mt-8 overflow-hidden rounded-3xl p-7 text-center sm:p-9">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold tracking-tight text-graphite">$21.95</span>
            <span className="text-slate2">/month per rep</span>
          </div>
          <div className="mt-2 inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ember">
            7-day free trial · cancel anytime
          </div>
          <ul className="mx-auto mt-6 max-w-sm space-y-2.5 text-left">
            {PRICE_INCLUDES.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-graphite">
                <span className="mt-0.5 text-emerald-600">✓</span>
                {p}
              </li>
            ))}
          </ul>
          <button onClick={onStart} className="mt-7 w-full rounded-full bg-gradient-to-r from-gold to-ember px-7 py-3.5 text-base font-bold text-white shadow-glow transition active:scale-95">
            Start your 7-day free trial →
          </button>
          <div className="mt-3 text-xs text-slate2">
            Free to start — your first 3 full presentations are on us.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-24 max-w-3xl px-5 sm:px-8">
        <div className="text-center reveal">
          <div className="text-xs font-bold uppercase tracking-widest text-gold">FAQ</div>
          <h2 className="tight mt-3 text-3xl font-bold text-graphite sm:text-4xl">Questions, answered.</h2>
        </div>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="card group rounded-2xl p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-graphite">
                {f.q}
                <span className="ml-3 shrink-0 text-slate2 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto mt-24 max-w-3xl px-5 pb-16 text-center sm:px-8">
        <div className="sun-soft" aria-hidden />
        <div className="relative reveal">
          <h2 className="tight text-3xl font-bold text-graphite sm:text-5xl">
            Your next pitch could close itself.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-slate2">
            Run your first bill in 60 seconds — free for your first 3 presentations.
          </p>
          <button onClick={onStart} className="mt-7 rounded-full bg-gradient-to-r from-gold to-ember px-8 py-4 text-lg font-bold text-white shadow-glow transition active:scale-95">
            Start free →
          </button>
          <div className="mt-4 text-sm text-slate2">No credit card required for the first 3 pitches.</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-0 border-t border-hair px-5 py-8 text-center text-xs text-slate2 sm:px-8">
        <div className="flex justify-center"><Wordmark /></div>
        <div className="mt-3">
          © 2026 SunLedger · Estimates only, not a binding offer. Verify rates and incentives for each customer.
        </div>
      </footer>
    </div>
  );
}
