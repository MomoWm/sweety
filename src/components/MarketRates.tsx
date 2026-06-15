import { useState } from "react";
import { cents } from "../lib/format";

interface Props {
  /** Utility all-in rate today, $/kWh. */
  gridRate: number;
  /** Locked Solar rate, $/kWh (0 hides the Solar bar). */
  solarRate?: number;
  provider: string;
}

// Approximate 2024 residential all-in averages (¢/kWh), U.S. EIA.
const BENCH = [
  { name: "U.S. average", c: 0.165 },
  { name: "New England avg", c: 0.29 },
  { name: "Connecticut avg", c: 0.32 },
  { name: "Hawaii (highest)", c: 0.41 },
];

/** Where this customer's rate sits among real market rates — and Solar. */
export function MarketRates({ gridRate, solarRate, provider }: Props) {
  const [open, setOpen] = useState(false);
  const rows = [
    ...BENCH.map((b) => ({ name: b.name, c: b.c, tone: "muted" as const })),
    { name: `Your ${provider}`, c: gridRate, tone: "grid" as const },
    ...(solarRate ? [{ name: "Solar (locked)", c: solarRate, tone: "solar" as const }] : []),
  ].sort((a, b) => a.c - b.c);

  const max = Math.max(...rows.map((r) => r.c));
  const multiple = gridRate / 0.165;

  return (
    <div className="card rounded-3xl p-5 sm:p-6">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <h3 className="text-lg font-bold text-graphite">How your rate compares</h3>
        <span className="shrink-0 text-slate2">{open ? "▲" : "▼"}</span>
      </button>
      {!open ? (
        <p className="mt-1 text-sm text-slate2">
          Your {provider} rate is <b className="text-ember">{multiple.toFixed(1)}× the U.S. average</b>. Tap to see the comparison.
        </p>
      ) : (
      <>
      <p className="mt-1 text-sm text-slate2">
        Your {provider} rate is{" "}
        <b className="text-ember">{multiple.toFixed(1)}× the U.S. average</b>
        {solarRate ? (
          <>
            {" "}— and solar locks you in at{" "}
            <b className="text-graphite">{cents(solarRate)}/kWh</b>.
          </>
        ) : (
          "."
        )}
      </p>

      <div className="mt-5 space-y-2.5">
        {rows.map((r) => {
          const pct = Math.max(8, Math.round((r.c / max) * 100));
          const bar =
            r.tone === "grid"
              ? "bg-gradient-to-r from-[#ff8a4c] to-ember"
              : r.tone === "solar"
                ? "bg-gradient-to-r from-gold to-[#f0b34a]"
                : "bg-hair";
          const strong = r.tone !== "muted";
          return (
            <div key={r.name} className="flex items-center gap-3">
              <span
                className={`w-32 shrink-0 text-xs ${
                  strong ? "font-semibold text-graphite" : "text-slate2"
                }`}
              >
                {r.name}
              </span>
              <div className="flex-1">
                <div
                  className={`flex h-7 items-center justify-end rounded-lg px-2 text-xs font-bold transition-all duration-700 ${bar} ${
                    r.tone === "muted" ? "text-slate2" : "text-white"
                  }`}
                  style={{ width: `${pct}%` }}
                >
                  {cents(r.c)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate2">
        Approximate 2024 residential all-in averages (U.S. EIA). Grid rates have
        risen for decades; the solar rate is contractually capped.
      </p>
      </>
      )}
    </div>
  );
}
