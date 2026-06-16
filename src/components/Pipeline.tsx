import { useMemo, useState } from "react";
import type { HomeownerRecord } from "../lib/account";

interface Props {
  list: HomeownerRecord[];
  onLoad: (r: HomeownerRecord) => void;
  onDelete: (id: string) => void;
  onMeta: (id: string, patch: { status?: string | null; notes?: string | null }) => void;
}

const STATUSES: { key: string; label: string; cls: string }[] = [
  { key: "new", label: "New", cls: "bg-cloud text-slate2" },
  { key: "hot", label: "🔥 Hot", cls: "bg-ember/10 text-ember" },
  { key: "follow_up", label: "Follow-up", cls: "bg-gold/15 text-gold" },
  { key: "closed", label: "✓ Closed", cls: "bg-emerald-100 text-emerald-700" },
];

function townOf(addr: string): string {
  const m = addr.match(/,\s*([A-Za-z .]+),\s*[A-Z]{2}/);
  return m ? m[1].trim() : addr;
}

/** The rep's homeowner pipeline — searchable, with status tags, notes, the
 *  last-presented date, and one-tap re-run. */
export function Pipeline({ list, onLoad, onDelete, onMeta }: Props) {
  const [q, setQ] = useState("");
  const [openNotes, setOpenNotes] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(
      (r) =>
        (r.bill.customerName || "").toLowerCase().includes(s) ||
        (r.bill.serviceAddress || "").toLowerCase().includes(s),
    );
  }, [list, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate2">
          My pipeline · {list.length}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or address"
          className="w-48 rounded-full border border-hair bg-snow px-4 py-2 text-sm text-graphite outline-none transition focus:border-gold sm:w-64"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const status = STATUSES.find((s) => s.key === r.status) ?? STATUSES[0];
          return (
            <div key={r.id} className="card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => onLoad(r)} className="min-w-0 flex-1 text-left">
                  <div className="truncate font-semibold text-graphite">{r.bill.customerName || "Unnamed"}</div>
                  <div className="truncate text-xs text-slate2">
                    {townOf(r.bill.serviceAddress) || "—"}
                    {r.lastPresented ? ` · presented ${new Date(r.lastPresented).toLocaleDateString()}` : ` · saved ${new Date(r.savedAt).toLocaleDateString()}`}
                  </div>
                </button>
                <select
                  value={r.status ?? "new"}
                  onChange={(e) => onMeta(r.id, { status: e.target.value })}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold outline-none ${status.cls}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => onLoad(r)}
                  className="shrink-0 rounded-full bg-gradient-to-r from-gold to-ember px-3.5 py-1.5 text-xs font-bold text-white shadow-glow transition active:scale-95"
                >
                  Open
                </button>
                <button onClick={() => onDelete(r.id)} aria-label="Delete" className="shrink-0 text-slate2 transition hover:text-ember">✕</button>
              </div>

              <button
                onClick={() => setOpenNotes(openNotes === r.id ? null : r.id)}
                className="mt-2 text-xs font-medium text-slate2 hover:text-graphite"
              >
                {r.notes ? "📝 " + (r.notes.length > 40 ? r.notes.slice(0, 40) + "…" : r.notes) : "+ Add a note"}
              </button>
              {openNotes === r.id && (
                <textarea
                  defaultValue={r.notes ?? ""}
                  onBlur={(e) => onMeta(r.id, { notes: e.target.value })}
                  placeholder="Notes about this homeowner…"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-hair bg-snow px-3 py-2 text-sm text-graphite outline-none focus:border-gold"
                />
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-hair p-6 text-center text-sm text-slate2">
            {list.length === 0 ? "Saved homeowners will appear here." : "No matches."}
          </div>
        )}
      </div>
    </div>
  );
}
