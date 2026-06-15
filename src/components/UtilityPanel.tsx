import type { Assumptions, Projection } from "../types";
import { SavingsChart } from "./SavingsChart";
import { usd, cents } from "../lib/format";

interface Props {
  projection: Projection;
  assumptions: Assumptions;
  provider: string;
}

/** "Without solar" view: a clean look at the rising utility bill. */
export function UtilityPanel({ projection, assumptions: a, provider }: Props) {
  const last = projection.rows[projection.rows.length - 1];
  const m1 = projection.monthlyWithoutYr1;
  const m25 = last ? last.billWithout / 12 : 0;
  const rate25 = a.gridRate * Math.pow(1 + a.gridEscalator, (last?.year ?? 25) - 1);

  return (
    <div className="card rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-graphite">What you'll pay {provider}</h3>
        <span className="flex items-center gap-1.5 text-xs text-slate2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ember" /> Your bill, rising
        </span>
      </div>

      <SavingsChart projection={projection} mode="utility" provider={provider} />

      <p className="mt-3 text-sm text-slate2">
        At <b className="text-graphite">{cents(a.gridRate)}/kWh</b> rising{" "}
        <b className="text-graphite">{(a.gridEscalator * 100).toFixed(2)}%/yr</b>, the
        average monthly bill climbs from{" "}
        <b className="text-graphite">{usd(m1)}/mo</b> today to{" "}
        <b className="text-ember">{usd(m25)}/mo</b> ({cents(rate25)}/kWh) by year{" "}
        {last?.year ?? 25} — with nothing to show for it.
      </p>
    </div>
  );
}
