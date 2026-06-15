import type { Projection } from "../types";
import { usd } from "../lib/format";

interface Props {
  projection: Projection;
  provider: string;
}

/** Side-by-side "today vs. solar" monthly bill, year 1 and year 10. */
export function ComparisonCard({ projection: p, provider }: Props) {
  const save1 = Math.max(0, p.monthlyWithoutYr1 - p.monthlyWithYr1);
  const save10 = Math.max(0, p.monthlyWithoutYr10 - p.monthlyWithYr10);
  const max = Math.max(p.monthlyWithoutYr1, p.monthlyWithoutYr10, 1);

  const Bar = ({
    label,
    today,
    solar,
    save,
  }: {
    label: string;
    today: number;
    solar: number;
    save: number;
  }) => (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-graphite">{label}</span>
        <span className="text-sm font-bold text-emerald-600">
          save {usd(save)}/mo
        </span>
      </div>
      <div className="space-y-2">
        <Row name={`${provider} bill`} value={today} max={max} tone="grid" />
        <Row name="With solar" value={solar} max={max} tone="solar" />
      </div>
    </div>
  );

  return (
    <div className="card rounded-3xl p-5 sm:p-6">
      <h3 className="mb-5 text-lg font-bold text-graphite">
        Their bill today vs. with solar
      </h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Bar
          label="Year 1"
          today={p.monthlyWithoutYr1}
          solar={p.monthlyWithYr1}
          save={save1}
        />
        <Bar
          label="Year 10"
          today={p.monthlyWithoutYr10}
          solar={p.monthlyWithYr10}
          save={save10}
        />
      </div>
      <p className="mt-5 text-xs text-slate2">
        "With solar" = the solar payment plus any power still bought from the
        grid. As {provider} keeps rising, the gap grows every year.
      </p>
    </div>
  );
}

function Row({
  name,
  value,
  max,
  tone,
}: {
  name: string;
  value: number;
  max: number;
  tone: "grid" | "solar";
}) {
  const pct = Math.max(4, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate2">{name}</span>
      <div className="h-7 flex-1 overflow-hidden rounded-lg bg-cloud">
        <div
          className={`flex h-full items-center justify-end rounded-lg px-2 text-xs font-bold text-white transition-all duration-700 ${
            tone === "grid"
              ? "bg-gradient-to-r from-[#ff8a4c] to-ember"
              : "bg-gradient-to-r from-gold to-[#f0b34a]"
          }`}
          style={{ width: `${pct}%` }}
        >
          {usd(value)}
        </div>
      </div>
    </div>
  );
}
