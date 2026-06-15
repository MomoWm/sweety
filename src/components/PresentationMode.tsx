import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { usd } from "../lib/format";

interface Props {
  customerName: string;
  provider: string;
  monthlyBill: number;
  monthlyWithYr1: number;
  monthlyWithYr10: number;
  monthlyWithoutYr1: number;
  monthlyWithoutYr10: number;
  year1MonthlySavings: number;
  year1AnnualSavings: number;
  cumulative10: number;
  cumulative25: number;
  lifetimeUtility: number;
  gridEscalator: number;
  /** Rep branding stamped on the closing slide (their face/name/number). */
  rep?: { full_name: string | null; company: string | null; phone: string | null; headshot_url: string | null } | null;
  onExit: () => void;
}

const BG = "#0A0A0F";
const GOLD = "#F59E0B";
const GREEN = "#22C55E";
const RED = "#EF4444";
const MUTE = "#8A8A99";

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** Respect the OS "reduce motion" setting — count-ups snap to their final
 *  value and the catch-up resolves instantly instead of animating. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

/** Animate 0 → target whenever `active` becomes true. */
function useCountUp(target: number, active: boolean, duration = 1600, ease = easeOutQuart): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const to = Number(target) || 0;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(to * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, ease, reduced]);
  return value;
}

const CSS = `
@keyframes pmAurora { 0%{transform:translate(-4%,-2%) scale(1)} 100%{transform:translate(4%,3%) scale(1.18)} }
@keyframes pmUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes pmGlowGold { 0%,100%{text-shadow:0 0 44px rgba(245,158,11,.40)} 50%{text-shadow:0 0 78px rgba(245,158,11,.85)} }
@keyframes pmGlowGreen { 0%,100%{text-shadow:0 0 44px rgba(34,197,94,.40)} 50%{text-shadow:0 0 80px rgba(34,197,94,.85)} }
@keyframes pmGlowRed { 0%,100%{text-shadow:0 0 44px rgba(239,68,68,.40)} 50%{text-shadow:0 0 84px rgba(239,68,68,.9)} }
@keyframes pmFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes pmTick { 0%{transform:scale(1.18);opacity:.55} 55%{transform:scale(.985)} 100%{transform:scale(1);opacity:1} }
@keyframes pmFadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes pmRing { 0%{transform:scale(.35);opacity:.65} 100%{transform:scale(3.8);opacity:0} }
@keyframes pmDrift { from{transform:translateY(0);opacity:1} to{transform:translateY(-90px);opacity:0} }
@keyframes pmRedPulse { 0%,100%{transform:scale(1);opacity:.95} 50%{transform:scale(1.25);opacity:1} }
@keyframes pmEmber { 0%{transform:translateY(0) scale(1);opacity:0} 14%{opacity:var(--o,.4)} 90%{opacity:var(--o,.4)} 100%{transform:translateY(-130px) scale(.35);opacity:0} }
@keyframes pmHint { 0%,100%{opacity:.5;transform:translateY(0)} 50%{opacity:.95;transform:translateY(-3px)} }
@keyframes pmShellIn { from{opacity:0} to{opacity:1} }
.pm-recharts .recharts-cartesian-axis-tick text { fill:#6B7280; font-size:12px; }
`;

/** Deterministic drifting embers — a quiet, premium sense of life behind the
 *  deck. Pure CSS so the global reduced-motion rule neutralizes them for free. */
const EMBERS = Array.from({ length: 18 }, (_, i) => {
  const r = (n: number) => (Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1;
  const f = (n: number) => Math.abs(r(n));
  return {
    left: 3 + f(1) * 94,
    size: 3 + f(2) * 5,
    dur: 8 + f(3) * 10,
    delay: f(4) * 10,
    o: 0.16 + f(5) * 0.34,
  };
});

// Clean chart geometry (viewBox units).
const VW = 600;
const VH = 300;
const PX0 = 56; // left
const PX1 = 524; // right (where line hits)
const PY0 = 248; // bottom (solar today)
const PY1 = 72; // top (today's price line / red dot)
const BASE = 262; // baseline for area fill
const ESC = 0.0299;

const fmtUsd = (n: number) => usd(n);

/**
 * Cinematic "catch-up" sequence: establish today's price line, then a solar
 * line climbs slowly (2.99%/yr) toward it while a heavy year counter ticks up,
 * slowing on each year. On impact, a shockwave rings out and the closing line
 * reveals — the utility's "today" line drifts upward, implying it keeps rising.
 */
function CatchUpAnimation({
  active,
  solarStart,
  todayBill,
  provider,
}: {
  active: boolean;
  solarStart: number;
  todayBill: number;
  provider: string;
}) {
  const N =
    solarStart > 0 && todayBill > solarStart
      ? Math.max(1, Math.min(30, Math.round(Math.log(todayBill / solarStart) / Math.log(1 + ESC))))
      : null;

  const reduced = usePrefersReducedMotion();
  const [climb, setClimb] = useState(0);
  const [yr, setYr] = useState(0);
  const [hit, setHit] = useState(false);

  useEffect(() => {
    if (!active || N == null) return;
    if (reduced) {
      setClimb(1);
      setYr(N);
      setHit(true);
      return;
    }
    let raf = 0;
    const perYear = Math.min(1.15, Math.max(0.5, 6.5 / N)); // slow, capped
    const T = N * perYear * 1000;
    const begin = performance.now() + 2000; // deliberate lead-in
    const loop = (now: number) => {
      if (now < begin) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const t = Math.min(1, (now - begin) / T);
      const raw = t * N;
      const i = Math.floor(raw);
      const fr = raw - i;
      const fancy = Math.min(N, i + fr * fr * (3 - 2 * fr)); // ease + pause each step
      setClimb(fancy / N);
      setYr(Math.min(N, Math.max(0, Math.round(fancy))));
      if (t < 1) raf = requestAnimationFrame(loop);
      else {
        setYr(N);
        setTimeout(() => setHit(true), 350);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, N, reduced]);

  if (N == null) {
    return (
      <div style={{ textAlign: "center", animation: "pmFadeIn 1s ease both" }}>
        <div style={{ fontSize: "clamp(2.2rem,7vw,4.5rem)", fontWeight: 800, color: RED, textShadow: "0 0 60px rgba(239,68,68,.6)" }}>Solar never catches up.</div>
        <p style={{ color: "#C7D2FE", fontStyle: "italic", fontSize: "clamp(1.2rem,3vw,1.9rem)", marginTop: 20 }}>Now imagine where {provider}&apos;s prices keep going.</p>
      </div>
    );
  }

  const xAt = (f: number) => PX0 + (PX1 - PX0) * f;
  const yAt = (f: number) => {
    const price = solarStart * Math.pow(1 + ESC, f * N);
    const pf = Math.min(1, (price - solarStart) / (todayBill - solarStart || 1));
    return PY0 - pf * (PY0 - PY1);
  };
  let line = "";
  const steps = 64;
  for (let s = 0; s <= steps; s++) {
    const f = climb * (s / steps);
    line += (s === 0 ? "M" : "L") + xAt(f).toFixed(1) + " " + yAt(f).toFixed(1) + " ";
  }
  const headX = xAt(climb);
  const headY = yAt(climb);
  const area = climb > 0 ? `${line} L ${headX.toFixed(1)} ${BASE} L ${PX0} ${BASE} Z` : "";
  const leftPct = (px: number) => `${(px / VW) * 100}%`;
  const topPct = (py: number) => `${(py / VH) * 100}%`;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 880, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* heavy ticking counter */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6, opacity: hit ? 0.25 : 1, transition: "opacity 1s ease" }}>
        <span key={yr} style={{ display: "inline-block", fontSize: "clamp(4.5rem, 18vw, 12rem)", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.04em", textShadow: "0 0 70px rgba(245,158,11,0.7)", animation: "pmTick .4s cubic-bezier(.3,1,.4,1)" }}>
          {yr}
        </span>
        <span style={{ fontSize: "clamp(1.4rem,4.5vw,2.6rem)", fontWeight: 800, color: GOLD }}>{N === 1 ? "year" : "years"}</span>
      </div>
      <div style={{ marginBottom: 14, color: MUTE, fontSize: "clamp(.85rem,2.2vw,1.2rem)", fontWeight: 600, opacity: hit ? 0 : 1, transition: "opacity .8s" }}>
        for solar to reach what you pay today
      </div>

      {/* clean chart */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "600 / 300" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id="pmCArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pmCLine" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={GOLD} />
              <stop offset="100%" stopColor="#FFC65A" />
            </linearGradient>
          </defs>

          {/* today's price line (dashed) + drift on reveal */}
          <g style={{ animation: hit ? "pmDrift 2.6s cubic-bezier(.4,0,.2,1) .4s forwards" : undefined }}>
            <line x1={36} y1={PY1} x2={VW - 18} y2={PY1} stroke={RED} strokeWidth={2} strokeDasharray="7 7" opacity={active ? 0.85 : 0} style={{ transition: "opacity 1s ease .3s" }} />
            <circle cx={PX1} cy={PY1} r={9} fill={RED} opacity={active ? 1 : 0} style={{ transformOrigin: `${PX1}px ${PY1}px`, transition: "opacity 1s ease .3s", animation: active && !hit ? "pmRedPulse 2.2s ease-in-out 1.2s infinite" : undefined, filter: `drop-shadow(0 0 12px ${RED})` }} />
          </g>

          {/* climbing solar line */}
          {climb > 0 && (
            <>
              <path d={area} fill="url(#pmCArea)" />
              <path d={line} fill="none" stroke="url(#pmCLine)" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${GOLD}aa)` }} />
              <circle cx={headX} cy={headY} r={7.5} fill="#fff" style={{ filter: `drop-shadow(0 0 12px ${GOLD})` }} />
            </>
          )}

          {/* shockwave on impact */}
          {hit && <circle cx={PX1} cy={PY1} r={16} fill="none" stroke={GOLD} strokeWidth={3} style={{ transformOrigin: `${PX1}px ${PY1}px`, animation: "pmRing 1.1s ease-out forwards" }} />}
        </svg>

        {/* labels */}
        <div style={{ position: "absolute", left: leftPct(PX1), top: topPct(PY1 - 26), transform: "translate(-100%,-50%)", color: "#FCA5A5", fontWeight: 700, fontSize: "clamp(.72rem,1.7vw,1rem)", whiteSpace: "nowrap", opacity: active && !hit ? 1 : 0, transition: "opacity .9s ease .6s" }}>
          What you pay today · {fmtUsd(todayBill)}/mo
        </div>
        <div style={{ position: "absolute", left: leftPct(PX0), top: topPct(PY0 + 16), transform: "translate(-10%,0)", color: GOLD, fontWeight: 700, fontSize: "clamp(.72rem,1.7vw,1rem)", whiteSpace: "nowrap", opacity: active && !hit ? 1 : 0, transition: "opacity .9s ease .6s" }}>
          Your solar · {fmtUsd(solarStart)}/mo
        </div>
      </div>

      {/* the reveal */}
      {hit && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
          <div style={{ maxWidth: 860 }}>
            <div style={{ fontSize: "clamp(1.5rem,4.6vw,3rem)", fontWeight: 800, color: "#fff", lineHeight: 1.18, opacity: 0, animation: "pmFadeIn 1.1s ease .2s both" }}>
              It took <span style={{ color: GOLD }}>{N} {N === 1 ? "year" : "years"}</span> for solar just to reach what you pay <i>today</i>.
            </div>
            <div style={{ marginTop: 26, fontSize: "clamp(1.3rem,3.8vw,2.3rem)", fontWeight: 700, fontStyle: "italic", color: "#FFD9D9", textShadow: "0 0 34px rgba(239,68,68,.45)", opacity: 0, animation: "pmFadeIn 1.2s ease 1.4s both" }}>
              So… where do you think {provider} will be {N} {N === 1 ? "year" : "years"} from now?
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fullscreen, swipeable 6-slide pitch overlay for showing the homeowner. */
export function PresentationMode(props: Props) {
  const {
    customerName,
    provider,
    monthlyBill,
    monthlyWithYr1,
    monthlyWithYr10,
    monthlyWithoutYr1,
    monthlyWithoutYr10,
    year1MonthlySavings,
    year1AnnualSavings,
    cumulative10,
    cumulative25,
    lifetimeUtility,
    gridEscalator,
    rep,
    onExit,
  } = props;

  const TOTAL = 6;
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => Math.min(TOTAL - 1, i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  // Catch-up slide inputs (solar climbing at 2.99% to today's bill).
  const todayBill = Number(monthlyBill) || 0;
  const solarStart = Number(monthlyWithYr1) || 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const touchX = useRef<number | null>(null);
  const swipedAt = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 55) {
      swipedAt.current = performance.now();
      if (dx < 0) next();
      else prev();
    }
    touchX.current = null;
  };
  // Tap anywhere to advance (tap the left edge to go back) — Keynote-style, so
  // a rep can run the whole pitch one-handed. Real controls are left alone.
  const onClickAdvance = (e: React.MouseEvent) => {
    if (performance.now() - swipedAt.current < 500) return; // a swipe just fired
    if ((e.target as HTMLElement).closest("a, button, input")) return;
    if (e.clientX < window.innerWidth * 0.28) prev();
    else next();
  };

  const billCount = useCountUp(monthlyBill, index === 0);
  const lifetimeCount = useCountUp(lifetimeUtility, index === 1);
  const savingsCount = useCountUp(cumulative25, index === 4);

  const esc = Number(gridEscalator) || 0;
  const base = Number(monthlyBill) || 0;
  const billSeries = Array.from({ length: 11 }, (_, y) => ({
    year: y,
    bill: Math.round(base * Math.pow(1 + esc, y)),
  }));
  const bill10 = billSeries[10]?.bill ?? 0;

  const savingsSeries = [
    { year: 0, saved: 0 },
    { year: 1, saved: Math.round(year1AnnualSavings) },
    { year: 10, saved: Math.round(cumulative10) },
    { year: 25, saved: Math.round(cumulative25) },
  ];

  const mailBody = [
    `Solar Savings Summary for ${customerName || "you"}`,
    `Utility: ${provider}`,
    ``,
    `Current monthly bill: ${usd(monthlyBill)}`,
    `Year-1 monthly savings: ${usd(year1MonthlySavings)}`,
    `Year-1 annual savings: ${usd(year1AnnualSavings)}`,
    `10-year cumulative savings: ${usd(cumulative10)}`,
    `25-year total savings: ${usd(cumulative25)}`,
    ``,
    `Without solar  Year 1: ${usd(monthlyWithoutYr1)}/mo   Year 10: ${usd(monthlyWithoutYr10)}/mo`,
    `With solar     Year 1: ${usd(monthlyWithYr1)}/mo   Year 10: ${usd(monthlyWithYr10)}/mo`,
    `Paid to ${provider} over 25 years without solar: ${usd(lifetimeUtility)}`,
  ].join("\n");
  const mailto = `mailto:?subject=${encodeURIComponent(
    "Your Solar Savings Summary",
  )}&body=${encodeURIComponent(mailBody)}`;

  // ---- style helpers ----
  const anim = (active: boolean, delay = 0): React.CSSProperties =>
    active ? { animation: `pmUp .7s cubic-bezier(.22,1,.36,1) ${delay}ms both` } : { opacity: 0 };
  const hero: React.CSSProperties = {
    fontSize: "clamp(3.75rem, 14vw, 10rem)",
    fontWeight: 800,
    lineHeight: 1,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.03em",
    fontVariantNumeric: "tabular-nums",
  };
  const heading: React.CSSProperties = {
    fontSize: "clamp(1.6rem, 4.5vw, 2.8rem)",
    fontWeight: 800,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.02em",
  };
  const eyebrow: React.CSSProperties = {
    fontSize: "clamp(.8rem, 2vw, 1.05rem)",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  };
  const sub: React.CSSProperties = {
    color: MUTE,
    fontSize: "clamp(1rem, 2.4vw, 1.4rem)",
    fontWeight: 500,
    margin: 0,
    maxWidth: 820,
  };
  const slideStyle: React.CSSProperties = {
    flex: "0 0 100%",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "clamp(48px, 9vh, 72px) clamp(20px, 5vw, 32px)",
    boxSizing: "border-box",
    gap: 14,
    overflowY: "auto", // never clip a tall slide on a short phone screen
  };

  // ---- comparison bars (slide 3) ----
  const barMax = Math.max(monthlyWithoutYr1, monthlyWithoutYr10, monthlyWithYr1, monthlyWithYr10, 1);
  const Bars = ({ a, color, active }: { a: { label: string; v: number }[]; color: string; active: boolean }) => (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 22, height: 150, marginTop: 6 }}>
      {a.map((b) => (
        <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(1.1rem,3vw,1.5rem)" }}>{usd(b.v)}</div>
          <div
            style={{
              width: 46,
              borderRadius: "8px 8px 0 0",
              background: `linear-gradient(180deg, ${color}, ${color}66)`,
              height: active ? `${Math.max(8, (b.v / barMax) * 100)}%` : "0%",
              transition: "height .9s cubic-bezier(.22,1,.36,1)",
              boxShadow: `0 0 24px -4px ${color}aa`,
            }}
          />
          <div style={{ color: MUTE, fontSize: ".8rem", fontWeight: 600 }}>{b.label}</div>
        </div>
      ))}
    </div>
  );

  const stat = (title: string, value: number, active: boolean, delay: number) => (
    <div
      key={title}
      style={{
        ...anim(active, delay),
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 18,
        padding: "20px 24px",
        minWidth: 160,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ color: GREEN, fontWeight: 800, fontSize: "clamp(1.5rem,4.5vw,2.2rem)", fontVariantNumeric: "tabular-nums" }}>{usd(value)}</div>
      <div style={{ color: MUTE, fontSize: ".85rem", marginTop: 4, fontWeight: 600 }}>{title}</div>
    </div>
  );

  const s0 = index === 0;
  const s1 = index === 1;
  const s2 = index === 2;
  const s4 = index === 4;
  const s5 = index === 5;

  const slides = [
    // ---------- Slide 1: The Bill ----------
    <div style={slideStyle} key="s1">
      <div style={{ ...anim(s0, 0), ...eyebrow, color: GOLD }}>
        {customerName || "Homeowner"} · {provider}
      </div>
      <div style={{ ...anim(s0, 120) }}>
        <div style={{ ...hero, animation: s0 ? "pmGlowGold 3.6s ease-in-out infinite" : undefined }}>{usd(billCount)}</div>
      </div>
      <p style={{ ...anim(s0, 240), ...sub }}>Here&apos;s what you&apos;re paying today — and where it&apos;s headed.</p>
      <div style={{ ...anim(s0, 360), width: "100%", maxWidth: 820, height: 290, marginTop: 10 }} className="pm-recharts">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={billSeries} margin={{ top: 18, right: 26, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="pmGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff0d" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "#ffffff1a" }} tickFormatter={(y) => `Y${y}`} />
            <YAxis tickLine={false} axisLine={false} width={62} tickFormatter={(v) => `$${Math.round(Number(v))}`} />
            <Area type="monotone" dataKey="bill" stroke={GOLD} strokeWidth={3.5} fill="url(#pmGold)" isAnimationActive={s0} animationDuration={1500} />
            <ReferenceDot x={10} y={bill10} r={6} fill={GOLD} stroke="#0A0A0F" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ ...anim(s0, 520), color: GOLD, fontWeight: 700, fontSize: "clamp(.95rem,2.2vw,1.2rem)" }}>
        ↑ {usd(bill10)}/mo by year 10
      </div>
    </div>,

    // ---------- Slide 2: The Problem ----------
    <div style={slideStyle} key="s2">
      <div style={{ ...anim(s1, 0), ...eyebrow, color: RED }}>The cost of doing nothing</div>
      <p style={{ ...anim(s1, 120), ...sub, color: "#D1D5DB", maxWidth: 720 }}>
        What {provider} will collect from you over the next 25 years
      </p>
      <div style={{ ...anim(s1, 200) }}>
        <div style={{ ...hero, color: RED, animation: s1 ? "pmGlowRed 3.4s ease-in-out infinite" : undefined }}>{usd(lifetimeCount)}</div>
      </div>
      <p style={{ ...anim(s1, 360), ...sub, marginTop: 10 }}>Every year you wait, the rate climbs — and it never comes back down.</p>
      <div style={{ ...anim(s1, 480), display: "flex", gap: 8, marginTop: 14 }}>
        {[0.35, 0.5, 0.68, 0.85, 1].map((h, i) => (
          <div key={i} style={{ width: 30, height: 70, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", height: s1 ? `${h * 100}%` : "0%", transition: `height .8s ease ${i * 120}ms`, background: `linear-gradient(180deg,${RED},${RED}55)`, borderRadius: "6px 6px 0 0" }} />
          </div>
        ))}
      </div>
    </div>,

    // ---------- Slide 3: The Solution ----------
    <div style={slideStyle} key="s3">
      <div style={{ ...anim(s2, 0), ...eyebrow, color: GOLD }}>The fix</div>
      <h2 style={{ ...anim(s2, 100), ...heading }}>Solar locks in your rate.</h2>
      <div style={{ ...anim(s2, 220), display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 760, marginTop: 12 }}>
        <div style={{ flex: "1 1 280px", maxWidth: 340, background: `${RED}12`, border: `1px solid ${RED}44`, borderRadius: 22, padding: "22px 18px" }}>
          <div style={{ color: RED, fontWeight: 800, fontSize: "1.05rem", letterSpacing: ".04em" }}>↑ WITHOUT SOLAR</div>
          <Bars a={[{ label: "Year 1", v: monthlyWithoutYr1 }, { label: "Year 10", v: monthlyWithoutYr10 }]} color={RED} active={s2} />
        </div>
        <div style={{ flex: "1 1 280px", maxWidth: 340, background: `${GREEN}12`, border: `1px solid ${GREEN}44`, borderRadius: 22, padding: "22px 18px" }}>
          <div style={{ color: GREEN, fontWeight: 800, fontSize: "1.05rem", letterSpacing: ".04em" }}>🔒 WITH SOLAR</div>
          <Bars a={[{ label: "Year 1", v: monthlyWithYr1 }, { label: "Year 10", v: monthlyWithYr10 }]} color={GREEN} active={s2} />
        </div>
      </div>
      <p style={{ ...anim(s2, 420), ...sub, marginTop: 16 }}>The utility can&apos;t touch your solar rate.</p>
    </div>,

    // ---------- Slide 4: The Catch-Up ----------
    <div style={slideStyle} key="catch">
      <CatchUpAnimation
        key={index === 3 ? "catch-on" : "catch-off"}
        active={index === 3}
        solarStart={solarStart}
        todayBill={todayBill}
        provider={provider}
      />
    </div>,

    // ---------- Slide 5: The Savings ----------
    <div style={slideStyle} key="s4">
      <div style={{ ...anim(s4, 0), ...eyebrow, color: GREEN }}>Your 25-year savings</div>
      <div style={{ ...anim(s4, 120) }}>
        <div style={{ ...hero, color: GREEN, animation: s4 ? "pmGlowGreen 3.6s ease-in-out infinite" : undefined }}>{usd(savingsCount)}</div>
      </div>
      <div style={{ ...anim(s4, 280), width: "100%", maxWidth: 760, height: 170, marginTop: 4 }} className="pm-recharts">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={savingsSeries} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="pmGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.55} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "#ffffff1a" }} tickFormatter={(y) => `Y${y}`} ticks={[1, 10, 25]} />
            <Area type="monotone" dataKey="saved" stroke={GREEN} strokeWidth={3.5} fill="url(#pmGreen)" isAnimationActive={s4} animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 18 }}>
        {stat("Year-1 / month", year1MonthlySavings, s4, 420)}
        {stat("Year-1 / year", year1AnnualSavings, s4, 520)}
        {stat("10-year savings", cumulative10, s4, 620)}
      </div>
    </div>,

    // ---------- Slide 6: Next Steps ----------
    <div style={slideStyle} key="s5">
      <div style={{ ...anim(s5, 0), fontSize: "clamp(3rem,9vw,5rem)", animation: s5 ? "pmFloat 4s ease-in-out infinite" : undefined }}>☀️</div>
      <h2 style={{ ...anim(s5, 120), ...heading }}>You&apos;re ready to go solar.</h2>
      <div style={{ width: "100%", maxWidth: 480, marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
        {["Review your custom proposal", "Schedule your site assessment", "Sign today and lock in your rate"].map((t, i) => (
          <div
            key={t}
            style={{
              ...anim(s5, 220 + i * 110),
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 16,
              padding: "16px 20px",
              textAlign: "left",
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: GOLD, color: BG, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
            <div style={{ color: "#E5E7EB", fontSize: "clamp(1rem,2.5vw,1.3rem)", fontWeight: 600 }}>{t}</div>
          </div>
        ))}
      </div>
      <a
        href={mailto}
        style={{
          ...anim(s5, 600),
          marginTop: 22,
          background: `linear-gradient(90deg, ${GOLD}, #E8630A)`,
          color: BG,
          fontWeight: 800,
          fontSize: "clamp(1.05rem,2.6vw,1.35rem)",
          padding: "18px 36px",
          borderRadius: 9999,
          textDecoration: "none",
          boxShadow: `0 14px 38px -8px ${GOLD}aa`,
        }}
      >
        Email me my savings summary →
      </a>
      {rep && (rep.full_name || rep.company || rep.phone) && (
        <div style={{ ...anim(s5, 720), marginTop: 26, display: "flex", alignItems: "center", gap: 14 }}>
          {rep.headshot_url && (
            <img src={rep.headshot_url} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.25)" }} />
          )}
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(1rem,2.4vw,1.25rem)" }}>{rep.full_name || rep.company}</div>
            <div style={{ color: MUTE, fontSize: "clamp(.8rem,2vw,1rem)" }}>
              {[rep.company && rep.full_name ? rep.company : null, rep.phone].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}
    </div>,
  ];

  const arrow = (side: "left" | "right", disabled: boolean): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    [side]: 14,
    transform: "translateY(-50%)",
    width: 54,
    height: 54,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    fontSize: 26,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.2 : 0.9,
    zIndex: 6,
  });

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onClickAdvance}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: BG,
        color: "#fff",
        overflow: "hidden",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        animation: "pmShellIn .45s ease both",
      }}
    >
      <style>{CSS}</style>

      {/* Animated cinematic backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-25%",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(40% 45% at 25% 15%, rgba(245,158,11,0.16), transparent 60%), radial-gradient(45% 50% at 80% 25%, rgba(232,99,10,0.12), transparent 60%), radial-gradient(50% 55% at 55% 100%, rgba(245,158,11,0.08), transparent 60%)",
          filter: "blur(50px)",
          animation: "pmAurora 16s ease-in-out infinite alternate",
        }}
      />
      {/* Drifting embers */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {EMBERS.map((e, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${e.left}%`,
              bottom: -12,
              width: e.size,
              height: e.size,
              borderRadius: "50%",
              opacity: 0,
              background: "radial-gradient(circle, #FCD34D, rgba(245,158,11,0))",
              ["--o" as string]: e.o,
              animation: `pmEmber ${e.dur}s linear ${e.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />

      {/* Top progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.07)", zIndex: 6 }}>
        <div style={{ height: "100%", width: `${((index + 1) / TOTAL) * 100}%`, background: `linear-gradient(90deg,${GOLD},#E8630A)`, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
      </div>

      {/* Top bar */}
      <div style={{ position: "absolute", top: 18, left: 22, color: MUTE, fontSize: ".85rem", fontWeight: 700, letterSpacing: ".1em", zIndex: 6 }}>
        {index + 1} / {TOTAL}
      </div>
      <button
        onClick={onExit}
        style={{ position: "absolute", top: 14, right: 16, zIndex: 7, padding: "9px 18px", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
      >
        Exit ✕
      </button>

      {/* Sliding track */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", height: "100%", width: "100%", transform: `translateX(-${index * 100}%)`, transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {slides}
      </div>

      {/* Arrows */}
      <button onClick={prev} disabled={index === 0} style={arrow("left", index === 0)}>‹</button>
      <button onClick={next} disabled={index === TOTAL - 1} style={arrow("right", index === TOTAL - 1)}>›</button>

      {/* First-time hint — disappears the moment they advance */}
      {index === 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 54,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: 9999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: ".82rem",
              fontWeight: 600,
              letterSpacing: ".02em",
              animation: "pmHint 2.4s ease-in-out infinite",
            }}
          >
            Tap anywhere to continue · swipe to move
          </span>
        </div>
      )}

      {/* Dots */}
      <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10, zIndex: 6 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{ width: i === index ? 30 : 10, height: 10, borderRadius: 9999, border: "none", background: i === index ? GOLD : "rgba(255,255,255,0.22)", cursor: "pointer", transition: "all .35s ease" }}
          />
        ))}
      </div>
    </div>
  );
}
