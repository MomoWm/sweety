import { useState } from "react";
import type { Projection, Assumptions } from "../types";
import { paybackYear } from "../lib/math";
import { usd } from "../lib/format";
import { CountUp } from "./CountUp";

interface Props {
  projection: Projection;
  assumptions: Assumptions;
  provider: string;
}

export function BreakEven({ projection, assumptions: _assumptions, provider }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const payback = paybackYear(projection);
  const displayYear = hovered ?? (payback ?? 25);
  const row = projection.rows[Math.max(0, displayYear - 1)];
  const cumSavings = row?.cumulative ?? 0;
  const isProfit = cumSavings > 0;

  const maxVal = Math.max(...projection.rows.map((r) => Math.abs(r.cumulative)));

  return (
    <div className="card rounded-3xl p-5 sm:p-6">
      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gold">Break-even analysis</div>
      <h3 className="text-lg font-bold text-graphite">
        {payback
          ? `Savings go positive in year ${payback}.`
          : "Savings build throughout the lease."}
      </h3>
      <p className="mt-1 text-sm text-slate2">
        {payback
          ? `Every dollar after year ${payback} is pure profit — locked in while ${provider} keeps rising.`
          : `At the current solar price, you're saving from day one.`}
      </p>

      {/* Interactive timeline */}
      <div className="mt-5 space-y-1" role="group" aria-label="Savings by year">
        {projection.rows.map((r) => {
          const frac = r.cumulative / maxVal;
          const isNeg = r.cumulative < 0;
          const isPayback = r.year === payback;
          const width = Math.max(4, Math.abs(frac) * 100);

          return (
            <div
              key={r.year}
              className="flex items-center gap-2 cursor-pointer group"
              onMouseEnter={() => setHovered(r.year)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(r.year)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="listitem"
            >
              <span
                className={`w-8 shrink-0 text-right text-[11px] font-semibold transition ${
                  hovered === r.year ? "text-graphite" : "text-slate2"
                }`}
              >
                Y{r.year}
              </span>
              <div className="flex-1 relative h-5 rounded-lg bg-cloud overflow-hidden">
                <div
                  className={`absolute top-0 h-full rounded-lg transition-all duration-300 ${
                    isPayback
                      ? "bg-gradient-to-r from-gold to-ember shadow-glow"
                      : isNeg
                      ? "bg-gradient-to-r from-ember/40 to-ember/60"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  }`}
                  style={{
                    width: `${width}%`,
                    left: isNeg ? `${50 - width / 2}%` : "0%",
                  }}
                />
                {isPayback && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    Break-even ✓
                  </div>
                )}
              </div>
              <span
                className={`w-20 shrink-0 text-right text-[11px] font-semibold tabular-nums transition ${
                  isNeg ? "text-ember" : "text-emerald-600"
                } ${hovered === r.year ? "scale-105" : ""}`}
              >
                {isNeg ? "-" : "+"}{usd(Math.abs(r.cumulative))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hover detail card */}
      <div
        className={`mt-4 rounded-2xl border p-4 transition-all duration-300 ${
          isProfit
            ? "border-emerald-200 bg-emerald-50/70"
            : "border-ember/30 bg-ember/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate2">
              {hovered ? `By end of year ${displayYear}` : payback ? `By year ${displayYear}` : "At year 25"}
            </div>
            <div
              className={`tnum text-2xl font-bold ${
                isProfit ? "text-emerald-700" : "text-ember"
              }`}
            >
              <CountUp
                value={Math.abs(cumSavings)}
                format={(n) => (cumSavings >= 0 ? "+" : "-") + usd(n)}
              />
            </div>
          </div>
          {payback && (
            <div className="text-right">
              <div className="text-xs text-slate2">Payback year</div>
              <div className="text-3xl font-bold text-graphite">{payback}</div>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-slate2">
          {isProfit
            ? `This home is ${usd(cumSavings)} ahead of where it would be paying ${provider}.`
            : `Still ${usd(Math.abs(cumSavings))} behind — solar catches up in year ${payback ?? "—"}.`}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate2">
        Hover any year to see exact cumulative savings. Green = ahead of the utility, orange = still catching up.
      </p>
    </div>
  );
}
