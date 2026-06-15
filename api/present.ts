// Vercel Serverless Function: the BULLETPROOF presentation gate.
// The free limit is counted entirely server-side (in Supabase), tied to the
// account, on a true calendar-monthly cycle. Clearing cache / localStorage /
// refreshing cannot reset it because the count never lives in the browser.
// Also logs account + device + IP for anti-abuse (fake-account farming).
// Requires env vars: SUPABASE_SERVICE_ROLE_KEY (secret), SUPABASE_URL (optional).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fxmrmhfpdkrkkgxzdkvq.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FREE_LIMIT = 3;

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const authHeader = (req.headers.authorization || "").toString();
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const deviceId: string | null = body.deviceId || null;
    if (!token) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      (req.socket?.remoteAddress ?? null);
    const now = new Date();
    const month = monthKey(now);

    const { data: profile } = await admin
      .from("profiles")
      .select("is_pro, presentations_used, period_month")
      .eq("id", user.id)
      .maybeSingle();

    const isPro = !!profile?.is_pro;
    // This account's count for the current month (resets when the month rolls).
    const accountUsed = profile?.period_month === month ? profile?.presentations_used ?? 0 : 0;

    if (isPro) {
      await admin.from("usage_events").insert({ user_id: user.id, device_id: deviceId, ip, kind: "pro_present" });
      res.status(200).json({ allowed: true, is_pro: true, used: accountUsed, limit: FREE_LIMIT });
      return;
    }

    // Anti-farming: the free limit is also enforced PER DEVICE this month, so
    // creating/switching accounts on the same device can't mint more free
    // presentations. The binding count is the higher of account vs device.
    let deviceUsed = 0;
    if (deviceId) {
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const { count } = await admin
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId)
        .eq("kind", "free_present")
        .gte("created_at", monthStart);
      deviceUsed = count ?? 0;
    }

    const used = Math.max(accountUsed, deviceUsed);
    if (used >= FREE_LIMIT) {
      res.status(200).json({ allowed: false, is_pro: false, used, limit: FREE_LIMIT });
      return;
    }

    await admin.from("profiles").update({ presentations_used: accountUsed + 1, period_month: month }).eq("id", user.id);
    await admin.from("usage_events").insert({ user_id: user.id, device_id: deviceId, ip, kind: "free_present" });
    res.status(200).json({ allowed: true, is_pro: false, used: used + 1, limit: FREE_LIMIT });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "present failed" });
  }
}
