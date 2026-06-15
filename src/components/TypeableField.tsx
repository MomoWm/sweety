import { useEffect, useState } from "react";

interface Props {
  /** Current numeric value (already in display units, e.g. percent). */
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  ariaLabel?: string;
  widthEm?: number;
}

/**
 * A number field that works with every on-screen + physical keyboard. Tapping
 * it selects the whole value, so the next digits typed replace it; backspace
 * fully clears (no stuck 0). Clamps to [min,max] on blur.
 */
export function TypeableField({
  value,
  onChange,
  min = 0,
  max = 100000,
  suffix,
  ariaLabel = "value",
  widthEm = 3,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(value)));

  useEffect(() => {
    if (!editing) setDraft(String(Math.round(value)));
  }, [value, editing]);

  return (
    <span className="inline-flex items-center rounded-lg border border-hair bg-snow px-2.5 py-1.5 focus-within:border-gold">
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
          const n = Math.min(max, Math.max(min, Number(draft) || 0));
          onChange(n);
          setDraft(String(n));
        }}
        onChange={(e) => {
          const s = e.target.value.replace(/[^0-9]/g, "");
          setDraft(s);
          // Cap the high end live; don't force the low end until blur.
          onChange(s === "" ? min : Math.min(max, Number(s)));
        }}
        className="bg-transparent text-right font-semibold text-graphite outline-none"
        style={{ width: `${widthEm}em` }}
        aria-label={ariaLabel}
      />
      {suffix && <span className="ml-0.5 text-sm text-slate2">{suffix}</span>}
    </span>
  );
}
