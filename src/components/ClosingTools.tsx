import { useEffect, useState } from "react";
import type { Assumptions, Projection } from "../types";
import { usd } from "../lib/format";
import { totalsThrough, npvOfSavings } from "../lib/math";

interface Props {
  projection: Projection;
  assumptions: Assumptions;
  provider: string;
}

/** A live counter of money lost for every month the homeowner waits. */
function CostOfWaiting({ monthlyLoss }: { monthlyLoss: number }) {
  const [lost, setLost] = useState(0);
  useEffect(() => {
    const perSec = Math.max(0, monthlyLoss) / (30 * 24 * 3600);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setLost(((now - start) / 1000) * perSec);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [monthlyLoss]);

  return (
    <div className="card overflow-hidden rounded-3xl p-6 text-center sm:p-7">
      <div className="text-xs font-bold uppercase tracking-widest text-ember">The cost of waiting</div>
      <div className="mt-2 tnum text-4xl font-bold text-ember sm:text-5xl">
        {usd(Math.round(monthlyLoss))}<span className="text-xl text-slate2">/mo</span>
      </div>
      <div className="mt-1 text-sm text-slate2">lost for every month you wait to switch</div>
      <div className="mt-4 rounded-2xl bg-ember/[0.06] px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate2">Gone since we sat down</div>
        <div className="tnum text-2xl font-bold text-ember">{usd(lost, 2)}</div>
      </div>
    </div>
  );
}

/** Keep renting from the utility (rising forever) vs lock in solar. */
function LockItIn({ utility25, savings25, provider }: { utility25: number; savings25: number; provider: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="card rounded-3xl border-l-4 border-ember p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-ember">Stay with {provider}</div>
        <div className="mt-2 tnum text-3xl font-bold text-graphite sm:text-4xl">{usd(utility25)}</div>
        <div className="mt-1 text-sm text-slate2">over 25 years — and it <span className="font-semibold text-ember">rises every single year.</span></div>
      </div>
      <div className="card rounded-3xl border-l-4 border-emerald-500 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-600">Switch to solar</div>
        <div className="mt-2 tnum text-3xl font-bold text-graphite sm:text-4xl">{usd(savings25)}</div>
        <div className="mt-1 text-sm text-slate2">saved over 25 years — with a <span className="font-semibold text-emerald-600">rate you lock in today.</span></div>
      </div>
    </div>
  );
}

function CompRow({ label, value, max, tone, note }: { label: string; value: number; max: number; tone: string; note: string }) {
  const pct = Math.max(10, Math.round((value / (max || 1)) * 100));
  const barColor =
    tone === "solar" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
    tone === "gold" ? "bg-gradient-to-r from-gold to-ember" :
    "bg-gradient-to-r from-hair to-slate2/40";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-graphite">{label}</span>
          <span className="ml-2 text-xs text-slate2">{note}</span>
        </div>
        <span className="shrink-0 text-sm font-bold text-graphite">{usd(value)}</span>
      </div>
      <div className="h-5 w-full overflow-hidden rounded-lg bg-cloud">
        <div className={`h-full rounded-lg transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ROIComparison({ projection, provider }: { projection: Projection; provider: string }) {
  const npv = npvOfSavings(projection, 25, 0.04);
  const savings25 = projection.cumulative25;
  const MARKET_RETURN = 0.10;
  const annualSavings = savings25 / 25;
  const stockValue = annualSavings * ((Math.pow(1 + MARKET_RETURN, 25) - 1) / MARKET_RETURN);

  return (
    <div className="card rounded-3xl p-6 sm:p-7">
      <div className="text-xs font-bold uppercase tracking-widest text-gold">Financial perspective</div>
      <h3 className="tight mt-1 text-xl font-bold text-graphite">What else could this money do?</h3>
      <p className="mt-2 text-sm text-slate2">
        The {usd(Math.round(annualSavings))}/yr you keep instead of paying {provider} — compared to other uses.
      </p>
      <div className="mt-5 space-y-3">
        <CompRow
          label="Solar savings (nominal)"
          value={savings25}
          max={Math.max(savings25, stockValue, npv)}
          tone="solar"
          note="guaranteed by your contract"
        />
        <CompRow
          label="Same $ in the stock market"
          value={stockValue}
          max={Math.max(savings25, stockValue, npv)}
          tone="muted"
          note="10% avg return — not guaranteed"
        />
        <CompRow
          label="NPV (in today's money)"
          value={npv}
          max={Math.max(savings25, stockValue, npv)}
          tone="gold"
          note="future savings at 4% discount"
        />
      </div>
      <p className="mt-4 text-xs text-slate2">
        Unlike stock market returns, solar savings are contractually fixed — the rate is locked, regardless of market conditions or utility rate hikes.
      </p>
    </div>
  );
}

/** Lease-focused closing tools (solar view). */
export function ClosingTools({ projection, assumptions: _assumptions, provider }: Props) {
  const utility25 = totalsThrough(projection, 25).without;
  const monthlyLoss = Math.max(0, projection.year1Monthly);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-gold">Close the deal</div>
        <h3 className="tight mt-1 text-2xl font-bold text-graphite">Make doing nothing impossible.</h3>
      </div>
      <CostOfWaiting monthlyLoss={monthlyLoss} />
      <LockItIn utility25={utility25} savings25={projection.cumulative25} provider={provider} />
      <ROIComparison projection={projection} provider={provider} />
    </div>
  );
}
