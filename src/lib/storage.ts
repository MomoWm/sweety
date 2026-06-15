import type { SavedHomeowner } from "../types";

const KEY = "sunledger.homeowners.v1";

export function loadHomeowners(): SavedHomeowner[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedHomeowner[]) : [];
  } catch {
    return [];
  }
}

function persist(list: SavedHomeowner[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function saveHomeowner(record: SavedHomeowner): SavedHomeowner[] {
  const list = loadHomeowners();
  const idx = list.findIndex((r) => r.id === record.id);
  if (idx >= 0) list[idx] = record;
  else list.unshift(record);
  persist(list);
  return list;
}

export function deleteHomeowner(id: string): SavedHomeowner[] {
  const list = loadHomeowners().filter((r) => r.id !== id);
  persist(list);
  return list;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(x: unknown): x is SavedHomeowner {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.savedAt === "number" &&
    typeof r.bill === "object" &&
    r.bill != null &&
    typeof r.assumptions === "object" &&
    r.assumptions != null
  );
}

export function exportHomeowners(list: SavedHomeowner[]): void {
  const payload = JSON.stringify(
    { app: "SunLedger", type: "homeowners", version: 1, exportedAt: Date.now(), homeowners: list },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sunledger-homeowners-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importHomeownersFromFile(file: File): Promise<SavedHomeowner[]> {
  const data: unknown = JSON.parse(await file.text());
  const incoming: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { homeowners?: unknown[] })?.homeowners)
      ? (data as { homeowners: unknown[] }).homeowners
      : [];
  const valid = incoming.filter(isRecord);
  if (valid.length === 0) throw new Error("No SunLedger homeowners found in that file.");
  const byId = new Map(loadHomeowners().map((r) => [r.id, r]));
  for (const r of valid) byId.set(r.id, r);
  const merged = Array.from(byId.values()).sort((a, b) => b.savedAt - a.savedAt);
  persist(merged);
  return merged;
}
