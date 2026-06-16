import { useState } from "react";
import type { Assumptions, Projection } from "../types";
import { usd } from "../lib/format";
import { co2TonsAvoided } from "../lib/math";
import { CountUp } from "./CountUp";

interface Props {
  projection: Projection;
  assumptions: Assumptions;
  provider: string;
}

const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

/** Trees / cars / CO2 — the feel-good reveal. */
function EnvironmentalImpact({ annualSolarKwh }: { annualSolarKwh: number }) {
  const tons = co2TonsAvoided(annualSolarKwh, 25);
  const trees = tons * 16.5;
  const carYears = tons / 4.6;
  const stats = [
    { icon: "🌳", value: trees, label: "trees planted" },
    { icon: "🚗", value: carYears, label: "cars off the road for a year" },
    { icon: "🌎", value: tons, label: "tons of CO₂ never burned" },
  ];
  return (
    <div className="card rounded-3xl p-6 text-center sm:p-7">
      <div className="text-xs font-bold uppercase tracking-widest text-emerald-600">Your impact over 25 years</div>
      <h3 className="tight mt-1 text-2xl font-bold text-graphite">It's not just money.</h3>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-emerald-50/70 p-4">
            <div className="text-3xl">{s.icon}</div>
            <CountUp value={s.value} format={fmtNum} className="tnum mt-1 block text-2xl font-bold text-emerald-700 sm:text-3xl" />
            <div className="mt-0.5 text-xs font-medium text-slate2">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Scrub through 25 years — savings stack while the utility bill keeps climbing. */
function TimeMachine({ projection, provider }: { projection: Projection; provider: string }) {
  const [year, setYear] = useState(25);
  const row = projection.rows[Math.max(0, year - 1)];
  const cumulative = row?.cumulative ?? 0;
  const billWithout = (row?.billWithout ?? 0) / 12;
  const billWith = (row?.billWith ?? 0) / 12;

  return (
    <div className="card rounded-3xl p-6 sm:p-7">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-gold">25-year time machine</div>
        <h3 className="tight mt-1 text-2xl font-bold text-graphite">Slide into the future.</h3>
      </div>

      <div className="mt-5 text-center">
        <div className="text-sm text-slate2">By year</div>
        <div className="tnum text-5xl font-bold text-graphite">{year}</div>
        <div className="accent-text tnum mt-2 text-3xl font-bold sm:text-4xl">{usd(Math.round(cumulative))}</div>
        <div className="text-sm text-slate2">saved so far</div>
      </div>

      <input
        type="range"
        min={1}
        max={25}
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        aria-label="Year"
        className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-hair accent-gold [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-glow"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate2"><span>Year 1</span><span>Year 25</span></div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ember/[0.06] p-4 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate2">{provider} bill / mo</div>
          <div className="tnum text-xl font-bold text-ember">{usd(Math.round(billWithout))}</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate2">With solar / mo</div>
          <div className="tnum text-xl font-bold text-emerald-700">{usd(Math.round(billWith))}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-cloud p-3 text-center text-sm font-semibold text-slate2">
        Your solar rate barely moves while {provider} keeps climbing.
      </div>
    </div>
  );
}

/** The emotional-close section (solar view). */
export function EmotionalClose({ projection, assumptions, provider }: Props) {
  const annualSolarKwh = assumptions.annualKwh * assumptions.offset;
  return (
    <div className="space-y-5">
      <EnvironmentalImpact annualSolarKwh={annualSolarKwh} />
      <TimeMachine projection={projection} provider={provider} />
    </div>
  );
}
