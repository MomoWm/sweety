import { useEffect, useRef, useState } from "react";

interface Props {
  /** Solar monthly bill ($). */
  value: number;
  onChange: (v: number) => void;
  /** Derived per-kWh rate, for the helper line. */
  impliedCents: number;
  /** Today's utility monthly bill, for the at-a-glance compare. */
  todayMonthly: number;
  provider: string;
}

/** Premium control: the rep types the solar plan's monthly bill price. */
export function SolarBillControl({
  value,
  onChange,
  impliedCents,
  todayMonthly,
  provider,
}: Props) {
  const save = Math.max(0, todayMonthly - value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(value)));

  // Keep the field in sync with external changes (+/- buttons) unless the rep
  // is actively typing in it.
  useEffect(() => {
    if (!editing) setDraft(String(Math.round(value)));
  }, [value, editing]);

  return (
    <div className="card relative overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate2">
          Solar plan price
        </span>
        <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-ember">
          🔒 locked rate
        </span>
      </div>

      {/* Big, obviously-editable amount: a tappable bordered field */}
      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="group flex w-full items-end justify-center gap-1 rounded-2xl border-2 border-dashed border-hair bg-snow px-4 py-3 transition focus-within:border-gold focus-within:bg-gold/[0.04] hover:border-gold/70"
      >
        <span className="mb-2 text-3xl font-bold text-slate2">$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          placeholder="0"
          onFocus={(e) => {
            setEditing(true);
            e.currentTarget.select();
          }}
          onChange={(e) => {
            const s = e.target.value.replace(/[^0-9]/g, "");
            setDraft(s);
            onChange(s === "" ? 0 : Number(s));
          }}
          onBlur={() => {
            setEditing(false);
            setDraft(String(Math.round(value)));
          }}
          className="w-[3.4em] bg-transparent text-center text-6xl font-black tracking-tight text-graphite caret-ember outline-none tabular-nums"
          aria-label="Solar monthly bill"
        />
        <span className="mb-2 text-lg font-semibold text-slate2">/mo</span>
        <span className="mb-3 ml-1 text-base text-slate2 opacity-60 transition group-hover:opacity-100">
          ✎
        </span>
      </button>

      <div className="mt-2 text-center text-xs text-slate2">
        Tap to type the price from the quote · ≈ {impliedCents.toFixed(1)}¢/kWh
      </div>

      {/* Quick adjust */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {[-25, -5, +5, +25].map((d) => (
          <button
            key={d}
            onClick={() => onChange(Math.max(0, Math.round(value + d)))}
            className="rounded-full border border-hair bg-snow px-3 py-1.5 text-sm font-semibold text-graphite transition active:scale-90 hover:border-gold"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* At-a-glance compare */}
      <div className="mt-5 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border border-hair bg-cloud p-3">
          <div className="text-xs text-slate2">{provider} avg/mo</div>
          <div className="text-xl font-bold text-ember">
            ${Math.round(todayMonthly)}
            <span className="text-sm font-medium text-slate2">/mo</span>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs text-slate2">You save</div>
          <div className="text-xl font-bold text-emerald-600">
            ${Math.round(save)}
            <span className="text-sm font-medium text-slate2">/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
