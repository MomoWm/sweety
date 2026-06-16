import { useEffect, useState } from "react";
import { TypeableField } from "./TypeableField";

interface Props {
  value: number;
  onChange: (v: number) => void;
  /** Solar coverage as a fraction (0..2 — up to 200%). */
  offset: number;
  onOffset: (v: number) => void;
}

/** The two solar inputs, visible up front: monthly price + coverage %.
 *  Draft-string price input so backspace fully clears (no stuck 0). */
export function SolarPriceField({ value, onChange, offset, onOffset }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(value)));

  useEffect(() => {
    if (!editing) setDraft(String(Math.round(value)));
  }, [value, editing]);

  return (
    <div className="card space-y-3 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-graphite">Solar plan price</div>
          <div className="text-xs text-slate2">type it now or later — $/mo from the quote</div>
        </div>
        <div className="flex items-center rounded-xl border border-hair bg-snow px-3 py-2 focus-within:border-gold">
          <span className="text-slate2">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            placeholder="0"
            onFocus={(e) => {
              setEditing(true);
              e.currentTarget.select();
            }}
            onBlur={() => {
              setEditing(false);
              setDraft(String(Math.round(value)));
            }}
            onChange={(e) => {
              const s = e.target.value.replace(/[^0-9]/g, "");
              setDraft(s);
              onChange(s === "" ? 0 : Number(s));
            }}
            className="w-16 bg-transparent text-right text-lg font-bold text-graphite outline-none"
            aria-label="Solar plan price"
          />
          <span className="text-sm text-slate2">/mo</span>
        </div>
      </div>

      <div className="border-t border-hair" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-graphite">Solar offset</div>
          <div className="text-xs text-slate2">% of the bill solar covers — up to 200%</div>
        </div>
        <TypeableField
          value={Math.round(offset * 100)}
          onChange={(p) => onOffset(Math.min(2, Math.max(0, p / 100)))}
          min={0}
          max={200}
          suffix="%"
          ariaLabel="Solar coverage percent"
        />
      </div>
    </div>
  );
}
