import { useState } from "react";
import type { Assumptions } from "../types";

interface Props {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  provider: string;
}

/** Collapsible realism dials — sensible defaults, tweak when needed. */
export function AdvancedAssumptions({ assumptions: a, onChange, provider }: Props) {
  const [open, setOpen] = useState(false);
  const set = (p: Partial<Assumptions>) => onChange({ ...a, ...p });

  return (
    <div className="card rounded-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-graphite">Assumptions</div>
          <div className="text-xs text-slate2">
            {provider} {(a.gridRate * 100).toFixed(1)}¢ +{(a.gridEscalator * 100).toFixed(1)}%/yr ·
            {" "}{Math.round(a.offset * 100)}% from solar
          </div>
        </div>
        <span className="ml-3 text-slate2">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-hair px-4 py-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-graphite">
                Franklin battery / backup
              </div>
              <div className="text-xs text-slate2">adds resilience value</div>
            </div>
            <input
              type="checkbox"
              checked={a.batteryEnabled}
              onChange={(e) => set({ batteryEnabled: e.target.checked })}
              className="h-5 w-5 accent-gold"
            />
          </label>
        </div>
      )}
    </div>
  );
}
