import { useState } from "react";
import { TypeableField } from "./TypeableField";

interface Props {
  /** Utility all-in rate today, $/kWh. */
  rate: number;
  /** Eversource (grid) escalator as a fraction — any value. */
  eversource: number;
  /** Solar (PPA) escalator as a fraction — 2.99% or 3.5% only. */
  solar: number;
  /** Solar coverage as a fraction (0..2 — up to 200%). */
  offset: number;
  onRate: (v: number) => void;
  onEversource: (v: number) => void;
  onSolar: (v: number) => void;
  onOffset: (v: number) => void;
  /** Utility name shown in the labels. */
  provider: string;
  /** Wrap in a card (used on the start screen). */
  card?: boolean;
  /** Show the Solar coverage row (hidden where it's shown elsewhere). */
  showOffset?: boolean;
}

const SOLAR_OPTS = [0.0299, 0.035];
const isOpt = (v: number, o: number) => Math.abs(v - o) < 0.0001;
const fmt = (o: number) => (o * 100).toFixed(2).replace(/\.?0+$/, "");

function Stepper({
  value,
  onChange,
  step,
  min = 0,
  max,
  decimals,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min?: number;
  max: number;
  decimals: number;
  label: string;
}) {
  const clamp = (v: number) =>
    Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clamp(value - step))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-snow text-lg text-graphite transition active:scale-90 hover:border-gold"
      >
        −
      </button>
      <div className="flex w-[4.6rem] items-center justify-end rounded-lg border border-hair bg-snow px-2 py-1.5">
        <input
          type="number"
          step={step}
          value={+value.toFixed(decimals)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-12 bg-transparent text-right font-semibold text-graphite outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={label}
        />
      </div>
      <button
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + step))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-hair bg-snow text-lg text-graphite transition active:scale-90 hover:border-gold"
      >
        +
      </button>
    </div>
  );
}

function Line({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-graphite">{title}</div>
        <div className="text-xs text-slate2">{hint}</div>
      </div>
      {children}
    </div>
  );
}

/**
 * Pre-bill rate settings — fully customizable before (and after) a bill is
 * uploaded, so a rep can set the *current* utility rate even if the printed
 * bill is out of date:
 *  • Eversource rate today (¢/kWh) — free value
 *  • Eversource increase / year — free %
 *  • Solar increase / year — 2.99% / 3.5% toggle only
 */
export function RateSettings({
  rate,
  eversource,
  solar,
  offset,
  onRate,
  onEversource,
  onSolar,
  onOffset,
  provider,
  card,
  showOffset = true,
}: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const showCustom = customOpen || !SOLAR_OPTS.some((o) => isOpt(solar, o));
  const body = (
    <div className="space-y-3">
      <div className="text-sm font-bold text-graphite">{provider} &amp; Solar rates</div>

      <Line title={`${provider} rate today`} hint="all-in ¢/kWh — override if it rose">
        <div className="flex items-center gap-1.5">
          <Stepper
            value={rate * 100}
            onChange={(v) => onRate(v / 100)}
            step={0.5}
            max={80}
            decimals={1}
            label="Eversource rate cents"
          />
          <span className="text-sm text-slate2">¢</span>
        </div>
      </Line>

      <div className="border-t border-hair" />

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-graphite">
              {provider} increase / year
            </div>
            <div className="text-xs text-slate2">any rate — the utility's hike</div>
          </div>
          <div className="text-xl font-bold text-ember">
            {(eversource * 100).toFixed(2).replace(/\.?0+$/, "")}%
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={0.2}
          step={0.0025}
          value={eversource}
          onChange={(e) => onEversource(Number(e.target.value))}
          aria-label="Eversource increase percent"
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-hair accent-ember [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ember [&::-webkit-slider-thumb]:shadow-glow"
        />
        <div className="mt-0.5 flex justify-between text-[11px] text-slate2">
          <span>0%</span>
          <span>20%</span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {[0.03, 0.045, 0.06, 0.08, 0.11, 0.15].map((v) => {
            const active = Math.abs(eversource - v) < 0.0001;
            return (
              <button
                key={v}
                onClick={() => onEversource(v)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active ? "border-ember bg-ember/10 text-ember" : "border-hair bg-snow text-graphite hover:border-ember"
                }`}
              >
                {(v * 100).toFixed(2).replace(/\.?0+$/, "")}%
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-hair" />

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-graphite">Solar increase / year</div>
            <div className="text-xs text-slate2">the plan's yearly escalator</div>
          </div>
          <div className="inline-flex rounded-full border border-hair bg-cloud p-1">
            {SOLAR_OPTS.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setCustomOpen(false);
                  onSolar(o);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  !showCustom && isOpt(solar, o)
                    ? "bg-snow text-ember shadow-card"
                    : "text-slate2 hover:text-graphite"
                }`}
              >
                {fmt(o)}%
              </button>
            ))}
            <button
              onClick={() => setCustomOpen(true)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                showCustom ? "bg-snow text-ember shadow-card" : "text-slate2 hover:text-graphite"
              }`}
            >
              Custom
            </button>
          </div>
        </div>
        {showCustom && (
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <span className="text-xs text-slate2">Your escalator</span>
            <div className="flex items-center rounded-lg border border-gold bg-gold/10 px-2 py-1">
              <input
                type="number"
                step={0.1}
                autoFocus
                value={+(solar * 100).toFixed(2)}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => onSolar(Math.max(0, Number(e.target.value) / 100))}
                className="w-12 bg-transparent text-right font-semibold text-graphite outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Custom solar escalator"
              />
              <span className="text-slate2">%</span>
            </div>
          </div>
        )}
      </div>

      {showOffset && (
        <>
          <div className="border-t border-hair" />
          <Line title="Solar offset" hint="% of the bill solar covers — up to 200%">
            <TypeableField
              value={Math.round(offset * 100)}
              onChange={(p) => onOffset(Math.min(2, Math.max(0, p / 100)))}
              min={0}
              max={200}
              suffix="%"
              ariaLabel="Solar coverage percent"
            />
          </Line>
        </>
      )}
    </div>
  );

  return card ? <div className="card rounded-2xl p-4 sm:p-5">{body}</div> : body;
}
