import { supabase } from "./supabase";
import type { SavedHomeowner } from "../types";

/** A user's profile row (mirrors public.profiles). */
export interface Profile {
  username: string | null;
  is_pro: boolean;
  presentations_used: number;
}

/** Free presentations per account per month before the paywall. */
export const FREE_PRESENTATIONS = 3;

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, is_pro, presentations_used")
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

/** A stable per-device id (anti-abuse correlation only — NOT the paywall count). */
function deviceId(): string {
  try {
    let id = localStorage.getItem("sl_device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("sl_device", id);
    }
    return id;
  } catch {
    return "na";
  }
}

export interface PresentResult {
  allowed: boolean;
  is_pro: boolean;
  used: number;
  limit: number;
}

/**
 * Ask the server whether this user may present, and (if a free user under the
 * monthly limit) consume one credit. The count is enforced server-side, so it
 * survives cache-clears, refreshes, and incognito. On a network error we fail
 * OPEN (allow) so a rep is never blocked mid-pitch at a kitchen table.
 */
export async function requestPresentation(token: string): Promise<PresentResult> {
  try {
    const res = await fetch("/api/present", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ deviceId: deviceId() }),
    });
    if (!res.ok) return { allowed: true, is_pro: false, used: 0, limit: FREE_PRESENTATIONS };
    return (await res.json()) as PresentResult;
  } catch {
    return { allowed: true, is_pro: false, used: 0, limit: FREE_PRESENTATIONS };
  }
}

// --- Rep branding ----------------------------------------------------------

export interface RepProfile {
  full_name: string | null;
  company: string | null;
  phone: string | null;
  license: string | null;
  tagline: string | null;
  headshot_url: string | null;
  handle: string | null;
}

export const EMPTY_REP: RepProfile = {
  full_name: null,
  company: null,
  phone: null,
  license: null,
  tagline: null,
  headshot_url: null,
  handle: null,
};

const REP_COLS = "full_name, company, phone, license, tagline, headshot_url, handle";

export async function fetchRepProfile(): Promise<RepProfile | null> {
  const { data } = await supabase.from("rep_profiles").select(REP_COLS).maybeSingle();
  return (data as RepProfile) ?? null;
}

/** Public lookup by handle (for shareable rep links like /mo). */
export async function fetchRepByHandle(handle: string): Promise<RepProfile | null> {
  const { data } = await supabase.from("rep_profiles").select(REP_COLS).eq("handle", handle).maybeSingle();
  return (data as RepProfile) ?? null;
}

export async function saveRepProfile(p: RepProfile): Promise<void> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;
  await supabase
    .from("rep_profiles")
    .upsert({ id: uid, ...p, updated_at: new Date().toISOString() }, { onConflict: "id" });
}

export async function uploadHeadshot(file: File): Promise<string | null> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${uid}/headshot.${ext}`;
  const { error } = await supabase.storage.from("headshots").upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from("headshots").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

// --- Cloud-synced saved homeowners (used when logged in) -------------------

/** A saved homeowner plus its CRM metadata (cloud only). */
export interface HomeownerRecord extends SavedHomeowner {
  status?: string | null;
  notes?: string | null;
  lastPresented?: string | null;
}

export async function listCloudHomeowners(): Promise<HomeownerRecord[]> {
  const { data, error } = await supabase
    .from("homeowners")
    .select("data, status, notes, last_presented")
    .order("saved_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    ...(r.data as SavedHomeowner),
    status: r.status as string | null,
    notes: r.notes as string | null,
    lastPresented: r.last_presented as string | null,
  }));
}

/** Update a homeowner's CRM status / notes. */
export async function updateHomeownerMeta(
  id: string,
  patch: { status?: string | null; notes?: string | null },
): Promise<void> {
  await supabase.from("homeowners").update(patch).eq("id", id);
}

/** Stamp the last time this homeowner was presented (history). */
export async function touchPresented(id: string): Promise<void> {
  await supabase.from("homeowners").update({ last_presented: new Date().toISOString() }).eq("id", id);
}

export async function saveCloudHomeowner(record: SavedHomeowner): Promise<void> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;
  await supabase
    .from("homeowners")
    .upsert(
      { id: record.id, user_id: uid, data: record, saved_at: new Date(record.savedAt).toISOString() },
      { onConflict: "id" },
    );
}

export async function deleteCloudHomeowner(id: string): Promise<void> {
  await supabase.from("homeowners").delete().eq("id", id);
}

// --- Stripe checkout (talks to the /api serverless functions) --------------

/** Start the $21.95/mo subscription checkout; redirects to Stripe. */
export async function startCheckout(userId: string, email: string | null): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, email, origin: window.location.origin }),
  });
  const json = await res.json();
  if (json.url) window.location.href = json.url as string;
  else throw new Error(json.error || "Could not start checkout.");
}

/** After returning from Stripe, confirm the session and flip the account Pro. */
export async function activateCheckout(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/activate?session_id=${encodeURIComponent(sessionId)}`);
    const json = await res.json();
    return !!json.pro;
  } catch {
    return false;
  }
}
