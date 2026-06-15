import { useEffect, useState } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

/**
 * A discreet top-bar control to set the solar plan's monthly price from
 * anywhere (any view, right after a bill loads) — collapsed it shows only a
 * lock, so the price stays private in front of the homeowner. Tap to type.
 */
export function SolarPriceQuickSet({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(value)));

  useEffect(() => {
    if (!open) setDraft(String(Math.round(value)));
  }, [value, open]);

  if (!open) {
    return (
      <button
        onClick={() => {
          setDraft(String(Math.round(value)));
          setOpen(true);
        }}
        title="Set solar price (stays private)"
        className="flex items-center gap-1.5 rounded-full border border-hair bg-snow/70 px-3 py-2 text-sm font-medium text-slate2 transition hover:border-gold hover:text-graphite"
      >
        <span aria-hidden>🔒</span> Solar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-gold bg-gold/10 px-3 py-1.5 text-sm">
      <span className="text-slate2">$</span>
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={draft}
        placeholder="0"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const s = e.target.value.replace(/[^0-9]/g, "");
          setDraft(s);
          onChange(s === "" ? 0 : Number(s));
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") setOpen(false);
        }}
        className="w-12 bg-transparent text-center font-bold text-graphite outline-none"
        aria-label="Solar monthly price"
      />
      <span className="text-slate2">/mo</span>
    </div>
  );
}
