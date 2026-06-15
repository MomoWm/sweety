import { useState } from "react";
import type { BillData } from "../types";
import { annualUsage, effectiveRate } from "../lib/math";
import { usd, cents, kwh } from "../lib/format";

interface Props {
  bill: BillData;
  /** Live annual usage driving the model (kWh). */
  annualKwh: number;
  onAnnualChange: (kwh: number) => void;
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-ember text-sm font-bold text-white">
        {n}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-graphite">{title}</div>
        <div className="text-sm text-slate2">{children}</div>
      </div>
    </div>
  );
}

/** Plain-English explanation of where every number comes from. */
export function UsageBreakdown({ bill, annualKwh, onAnnualChange }: Props) {
  const au = annualUsage(bill.usageHistory, bill.monthlyKwh);
  const [open, setOpen] = useState(au.estimated); // open when it needs confirming
  const rate = effectiveRate(bill.monthlyCharge, bill.monthlyKwh);
  const avgMonthlyBill = rate ? (annualKwh * rate) / 12 : bill.monthlyCharge ?? 0;
  const monthsLabel =
    au.monthsOfData === 0
      ? "no months"
      : `${au.monthsOfData} month${au.monthsOfData === 1 ? "" : "s"}`;

  return (
    <div className="card rounded-3xl p-5 sm:p-6">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <h3 className="text-lg font-bold text-graphite">How we got these numbers</h3>
        <span className="shrink-0 text-slate2">
          {au.estimated && !open && (
            <span className="mr-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-ember">confirm usage</span>
          )}
          {open ? "▲" : "▼"}
        </span>
      </button>
      {!open ? (
        <p className="mt-1 text-sm text-slate2">
          {bill.monthlyKwh ? `${kwh(bill.monthlyKwh)} this month at ${rate ? cents(rate) : "—"}/kWh · ` : ""}
          ~{kwh(annualKwh)}/yr. Tap to see the breakdown{au.estimated ? " and confirm yearly usage" : ""}.
        </p>
      ) : (
      <>
      <div className="mt-4 space-y-4">
        <Step n={1} title="This month's usage (straight off the bill)">
          {bill.monthlyKwh ? (
            <>
              The {bill.provider || "utility"} bill
              {bill.billingPeriod ? ` (${bill.billingPeriod})` : ""} shows{" "}
              <b className="text-graphite">{kwh(bill.monthlyKwh)}</b> used for{" "}
              <b className="text-graphite">{usd(bill.monthlyCharge ?? 0, 2)}</b>.
            </>
          ) : (
            "Add the monthly kWh below."
          )}
        </Step>

        <Step n={2} title="The real price per kWh">
          {rate ? (
            <>
              We divide the total by the kWh:{" "}
              <b className="text-graphite">
                {usd(bill.monthlyCharge ?? 0, 2)} ÷ {kwh(bill.monthlyKwh ?? 0)} ={" "}
                {cents(rate)}/kWh
              </b>
              . That all-in price is what they actually pay — higher than the
              "supply" rate printed on the bill
              {bill.printedSupplyRate != null
                ? ` (${bill.printedSupplyRate.toFixed(1)}¢)`
                : ""}
              .
            </>
          ) : (
            "Add the monthly charge to see the true rate."
          )}
        </Step>

        <Step n={3} title="A full year of usage">
          {au.estimated ? (
            <>
              This bill shows <b className="text-graphite">{monthsLabel}</b> of
              history — not a full year.{" "}
              {au.monthsOfData > 1 ? (
                <>
                  So we averaged those {au.monthsOfData} months and annualized to{" "}
                  <b className="text-graphite">{kwh(au.kwh)}/year</b>.
                </>
              ) : (
                <>
                  So we estimated the year as{" "}
                  <b className="text-graphite">this month × 12</b>.
                </>
              )}{" "}
              Confirm the home's real yearly usage for accuracy 👇
            </>
          ) : (
            <>
              The bill shows a <b className="text-graphite">full year</b>
              {au.monthsOfData > 12
                ? ` — we use the 12 most recent of ${au.monthsOfData} months`
                : ""}
              . That comes to <b className="text-graphite">{kwh(au.kwh)}/year</b>.
            </>
          )}
        </Step>

        <Step n={4} title="Average monthly electric bill">
          About <b className="text-graphite">{usd(avgMonthlyBill)}/month</b> — the
          yearly usage ({kwh(annualKwh)}) at {rate ? cents(rate) : "—"}/kWh,
          spread across 12 months.
        </Step>
      </div>

      {/* Yearly usage input — emphasized when the bill is under 12 months */}
      <div
        className={`mt-5 rounded-2xl border p-4 ${
          au.estimated
            ? "border-gold/50 bg-gold/[0.06]"
            : "border-hair bg-cloud"
        }`}
      >
        <label className="block">
          <span className="text-sm font-semibold text-graphite">
            Home's yearly usage (kWh)
            {au.estimated && (
              <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-ember">
                please confirm
              </span>
            )}
          </span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              step={100}
              value={Math.round(annualKwh)}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => onAnnualChange(Number(e.target.value))}
              className="w-40 rounded-xl border border-hair bg-snow px-3 py-2.5 text-lg font-semibold text-graphite outline-none focus:border-gold"
            />
            <span className="text-sm text-slate2">kWh / year</span>
          </div>
          <p className="mt-2 text-xs text-slate2">
            {au.estimated
              ? "Tip: read it from the bill's 12-month usage graph, or last year's total. This drives every savings number."
              : "Auto-summed from the bill's 12-month chart. Edit if you have a better figure."}
          </p>
        </label>
      </div>
      </>
      )}
    </div>
  );
}
