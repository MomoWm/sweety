import { useState } from "react";
import type { Assumptions, Projection } from "../types";
import { SavingsChart } from "./SavingsChart";
import {
  savedByYear,
  totalsThrough,
  npvOfSavings,
  blendedRates,
  co2TonsAvoided,
} from "../lib/math";
import { usd, cents } from "../lib/format";

interface Props {
  projection: Projection;
  assumptions: Assumptions;
  provider: string;
}

export function Calculator({ projection, assumptions, provider }: Props) {
  const [horizon, setHorizon] = useState(25);
  const [mode, setMode] = useState<"annual" | "cumulative">("cumulative");

  const saved = savedByYear(projection, horizon);
  const totals = totalsThrough(projection, horizon);
  const npv = npvOfSavings(projection, horizon);
  const blend = blendedRates(projection, horizon);
  const co2 = co2TonsAvoided(assumptions.annualKwh * assumptions.offset, horizon);
  const cars = co2 / 4.6; // EPA: ~4.6 t CO₂/yr per gas car

  return (
    <div className="card rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-graphite">Savings calculator</h3>
        <div className="inline-flex rounded-full border border-hair bg-cloud p-1 text-sm">
          {(["cumulative", "annual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                mode === m ? "bg-snow text-graphite shadow-card" : "text-slate2"
              }`}
            >
              {m === "cumulative" ? "Savings" : "Cost"}
            </button>
          ))}
        </div>
      </div>

      {/* Horizon scrubber + live total */}
      <div className="mb-4 rounded-2xl border border-hair bg-cloud p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate2">
              Saved by year {horizon}
            </div>
            <div className="accent-text tnum text-4xl font-black sm:text-5xl">
              {usd(saved)}
            </div>
          </div>
          <div className="text-right text-sm text-slate2">
            ≈ {usd(saved / (horizon * 12))}/mo
            <br />
            avg over {horizon} yrs
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={25}
          step={1}
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-hair accent-gold [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-glow"
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate2">
          <span>Year 1</span>
          <span>Year 25</span>
        </div>
      </div>

      <SavingsChart projection={projection} mode={mode} markerYear={horizon} provider={provider} />

      {/* Impact stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile
          label="Worth in today's money"
          value={usd(npv)}
          sub="future savings, in today's value"
        />
        <Tile
          label="Average rate"
          value={`${cents(blend.solar)} vs ${cents(blend.grid)}`}
          sub="solar vs utility, over time"
        />
        <Tile
          label="CO₂ avoided"
          value={`${co2.toFixed(1)} t`}
          sub={`≈ ${cars.toFixed(1)} cars off the road / yr`}
        />
      </div>

      {/* Lifetime do-nothing vs solar */}
      <div className="mt-5 rounded-2xl border border-hair bg-cloud p-4">
        <div className="mb-3 text-sm font-semibold text-graphite">
          Total paid over {horizon} years
        </div>
        <TotalBar label={`Stay with ${provider}`} value={totals.without} max={totals.without} tone="grid" />
        <div className="h-2" />
        <TotalBar label="Switch to Solar" value={totals.withSolar} max={totals.without} tone="solar" />
        <div className="mt-3 flex items-center justify-between border-t border-hair pt-3">
          <span className="text-sm font-semibold text-graphite">You keep</span>
          <span className="text-xl font-bold text-emerald-600">
            {usd(totals.without - totals.withSolar)}
          </span>
        </div>
      </div>

      <YearTable projection={projection} horizon={horizon} provider={provider} />
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-hair bg-snow p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-slate2">{label}</div>
      <div className="tnum mt-0.5 text-lg font-bold text-graphite">{value}</div>
      <div className="text-[11px] text-slate2">{sub}</div>
    </div>
  );
}

function TotalBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "grid" | "solar";
}) {
  const pct = Math.max(6, Math.round((value / (max || 1)) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate2">{label}</span>
        <span className="font-semibold text-graphite">{usd(value)}</span>
      </div>
      <div className="h-6 w-full overflow-hidden rounded-lg bg-snow">
        <div
          className={`h-full rounded-lg transition-all duration-700 ${
            tone === "grid"
              ? "bg-gradient-to-r from-[#ff8a4c] to-ember"
              : "bg-gradient-to-r from-gold to-[#f0b34a]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function YearTable({
  projection,
  horizon,
  provider,
}: {
  projection: Projection;
  horizon: number;
  provider: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-ember"
      >
        {open ? "Hide" : "Show"} year-by-year detail {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-hair">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0 bg-cloud text-xs text-slate2">
              <tr>
                <th className="px-3 py-2 text-left">Year</th>
                <th className="px-3 py-2">{provider}</th>
                <th className="px-3 py-2">Solar</th>
                <th className="px-3 py-2">Saved</th>
                <th className="px-3 py-2">Total saved</th>
              </tr>
            </thead>
            <tbody>
              {projection.rows.slice(0, horizon).map((r) => (
                <tr key={r.year} className="border-t border-hair">
                  <td className="px-3 py-1.5 text-left font-medium text-graphite">{r.year}</td>
                  <td className="px-3 py-1.5 text-slate2">{usd(r.billWithout)}</td>
                  <td className="px-3 py-1.5 text-slate2">{usd(r.billWith)}</td>
                  <td className="px-3 py-1.5 font-medium text-graphite">{usd(r.savings)}</td>
                  <td className="px-3 py-1.5 font-semibold text-ember">{usd(r.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
