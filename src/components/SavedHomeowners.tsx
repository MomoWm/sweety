import { useState } from "react";
import type { SavedHomeowner } from "../types";
import { exportHomeowners, importHomeownersFromFile } from "../lib/storage";

interface Props {
  list: SavedHomeowner[];
  onLoad: (record: SavedHomeowner) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  /** Called after a backup file is imported, with the merged list. */
  onImported?: (list: SavedHomeowner[]) => void;
  hideSave?: boolean;
}

export function SavedHomeowners({ list, onLoad, onDelete, onSave, onImported, hideSave }: Props) {
  const [error, setError] = useState("");

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-imported
    if (!file) return;
    setError("");
    try {
      const merged = await importHomeownersFromFile(file);
      onImported?.(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate2">
          Saved homeowners
        </span>
        <div className="flex items-center gap-3">
          {!hideSave && (
            <button onClick={onSave} className="text-xs font-semibold text-ember">
              + Save current
            </button>
          )}
          <button
            onClick={() => exportHomeowners(list)}
            disabled={list.length === 0}
            className="text-xs font-semibold text-slate2 transition hover:text-graphite disabled:opacity-40"
          >
            ⬆ Back up
          </button>
          <label className="cursor-pointer text-xs font-semibold text-slate2 transition hover:text-graphite">
            ⬇ Restore
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {error && (
        <div role="alert" className="text-xs text-ember">
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {list.map((r) => (
          <div
            key={r.id}
            className="card flex shrink-0 items-center gap-2 rounded-xl px-3 py-2"
          >
            <button onClick={() => onLoad(r)} className="text-left">
              <div className="max-w-[140px] truncate text-sm font-medium text-graphite">
                {r.bill.customerName || "Unnamed"}
              </div>
              <div className="text-[11px] text-slate2">
                {new Date(r.savedAt).toLocaleDateString()}
              </div>
            </button>
            <button
              onClick={() => onDelete(r.id)}
              className="text-xs text-slate2 transition hover:text-ember"
              aria-label="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
