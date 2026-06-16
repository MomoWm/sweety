import { PROVIDERS } from "../lib/parser";

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Wrap in a card (start screen). */
  card?: boolean;
}

/** Pick the utility (auto-detected from the bill, or chosen by hand). */
export function ProviderSelect({ value, onChange, card }: Props) {
  // Always show the current value, even if it was auto-detected but isn't in
  // the base list (broad coverage across utilities).
  const options = PROVIDERS.includes(value) ? PROVIDERS : [value, ...PROVIDERS];
  const body = (
    <label className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-graphite">Utility company</div>
        <div className="text-xs text-slate2">auto-detected from the bill</div>
      </div>
      <select
        value={value || "Eversource"}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-hair bg-snow px-3 py-2 text-sm font-semibold text-graphite outline-none focus:border-gold"
      >
        {options.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </label>
  );
  return card ? <div className="card rounded-2xl p-4 sm:p-5">{body}</div> : body;
}
