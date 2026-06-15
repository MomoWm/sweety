import type { Assumptions, BillData, Projection } from "../types";
import type { RepProfile } from "../lib/account";
import { usd, cents } from "../lib/format";
import { SavingsChart } from "./SavingsChart";

interface Props {
  bill: BillData;
  assumptions: Assumptions;
  projection: Projection;
  rep?: RepProfile | null;
  /** Pro accounts get a fully white-labeled proposal (no SunLedger tag). */
  pro?: boolean;
}

/** Clean one-page proposal — on screen and via window.print().
 *  Branded to the rep (their face/name/number prominent) when set. */
export function Proposal({ bill, assumptions: a, projection: p, rep, pro }: Props) {
  const hasRep = !!(rep && (rep.full_name || rep.company || rep.phone || rep.headshot_url));
  const stats = [
    { label: "Year-1 monthly savings", value: usd(p.year1Monthly) },
    { label: "Year-1 annual savings", value: usd(p.year1Annual) },
    { label: "10-year savings", value: usd(p.cumulative10) },
    { label: "25-year savings", value: usd(p.cumulative25) },
  ];

  return (
    <div className="proposal-print card space-y-5 rounded-3xl p-6 print:border-0 print:bg-white print:shadow-none">
      {/* Rep-branded header (their face/name/number front and center) */}
      {hasRep && (
        <div className="flex items-center gap-4 border-b border-hair pb-4">
          {rep?.headshot_url && (
            <img src={rep.headshot_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
          )}
          <div className="min-w-0">
            <div className="text-xl font-bold text-graphite">{rep?.full_name || "Your Solar Advisor"}</div>
            <div className="text-sm text-slate2">
              {[rep?.company, rep?.tagline].filter(Boolean).join(" · ")}
            </div>
            <div className="text-sm font-semibold text-ember">
              {[rep?.phone, rep?.license ? `Lic ${rep.license}` : ""].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-graphite">Your Solar Savings Proposal</div>
          <div className="text-sm text-slate2">
            Prepared for {bill.customerName || "Homeowner"}
            {bill.serviceAddress ? ` · ${bill.serviceAddress}` : ""}
          </div>
        </div>
        <div className="text-right text-xs text-slate2">
          {new Date().toLocaleDateString()}
          <br />
          {bill.provider}
          {bill.accountNumber ? ` · Acct ${bill.accountNumber}` : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-hair bg-cloud p-3">
            <div className="text-xs text-slate2">{s.label}</div>
            <div className="accent-text text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <SavingsChart projection={p} provider={bill.provider || "Eversource"} />

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1 text-slate2">
          <div className="font-semibold text-graphite">Assumptions</div>
          <div>Grid all-in rate: {cents(a.gridRate)}/kWh, +{(a.gridEscalator * 100).toFixed(1)}%/yr</div>
          <div>Solar: {usd(a.solarMonthly)}/mo (≈{cents(a.ppaRate)}/kWh), +{(a.ppaEscalator * 100).toFixed(2)}%/yr</div>
          <div>Yearly usage: {a.annualKwh.toLocaleString()} kWh · offset {Math.round(a.offset * 100)}%</div>
          <div>Term: {a.termYears} years{a.batteryEnabled ? " · Franklin battery backup" : ""}</div>
        </div>
        <div className="space-y-1 text-slate2">
          <div className="font-semibold text-graphite">Next steps</div>
          <div>1. Confirm these numbers reflect your usage.</div>
          <div>2. Reserve your rate &amp; schedule the site design.</div>
          <div>3. Sign the agreement — no upfront cost.</div>
          <div>4. Installation &amp; activation.</div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate2">
        Estimates based on the figures above and CT historical rate trends.
        Actual savings vary with usage and utility rates. Not a binding offer.
      </p>
      {!pro && <div className="text-right text-[10px] text-slate2">Made with SunLedger</div>}
    </div>
  );
}
