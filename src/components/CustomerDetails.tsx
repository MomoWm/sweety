import { useState } from "react";
import type { BillData } from "../types";

interface Props {
  bill: BillData;
  onChange: (bill: BillData) => void;
}

const inputCls =
  "w-full rounded-lg border border-hair bg-snow px-3 py-2 text-sm text-graphite placeholder-slate2/60 outline-none focus:border-gold";

export function CustomerDetails({ bill, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const set = (p: Partial<BillData>) => onChange({ ...bill, ...p });
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

  return (
    <div className="card rounded-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-graphite">
            {bill.customerName || "Customer details"}
          </div>
          <div className="truncate text-xs text-slate2">
            {bill.serviceAddress || "Tap to view / edit what we read"}
          </div>
        </div>
        <span className="ml-3 text-slate2">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-hair px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className={inputCls} value={bill.customerName} placeholder="Name" onFocus={(e) => e.currentTarget.select()} onChange={(e) => set({ customerName: e.target.value })} />
            <input className={inputCls} value={bill.serviceAddress} placeholder="Address" onFocus={(e) => e.currentTarget.select()} onChange={(e) => set({ serviceAddress: e.target.value })} />
            <input className={inputCls} value={bill.accountNumber} placeholder="Account #" onFocus={(e) => e.currentTarget.select()} onChange={(e) => set({ accountNumber: e.target.value })} />
            <input className={inputCls} value={bill.billingPeriod} placeholder="Billing period" onFocus={(e) => e.currentTarget.select()} onChange={(e) => set({ billingPeriod: e.target.value })} />
            <label className="text-xs text-slate2">
              Monthly kWh
              <input className={inputCls} inputMode="decimal" value={bill.monthlyKwh ?? ""} placeholder="e.g. 1978" onFocus={(e) => e.currentTarget.select()} onChange={(e) => set({ monthlyKwh: numOrNull(e.target.value) })} />
            </label>
            <label className="text-xs text-slate2">
              Monthly charge ($)
              <input className={inputCls} inputMode="decimal" value={bill.monthlyCharge ?? ""} placeholder="e.g. 569.40" onFocus={(e) => e.currentTarget.select()} onChange={(e) => set({ monthlyCharge: numOrNull(e.target.value) })} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
