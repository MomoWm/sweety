// Vercel Serverless Function: after the customer returns from Stripe Checkout,
// the app calls this with the session_id. We confirm the subscription is live
// (trialing or active) and flip the user's profile to Pro using the Supabase
// service-role key (which safely bypasses row-level security on the server).
// Requires env vars:
//   STRIPE_SECRET_KEY            (secret)
//   SUPABASE_SERVICE_ROLE_KEY    (secret)
//   SUPABASE_URL                 (optional; defaults to the project URL)
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const SUPABASE_URL = process.env.SUPABASE_URL || "https://fxmrmhfpdkrkkgxzdkvq.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(req: any, res: any) {
  try {
    const sessionId = req.query?.session_id || (req.body && req.body.session_id);
    if (!sessionId) {
      res.status(400).json({ error: "Missing session_id" });
      return;
    }
    const session = await stripe.checkout.sessions.retrieve(String(sessionId), {
      expand: ["subscription"],
    });
    const userId = session.client_reference_id;
    const sub: any = session.subscription;
    const status = sub && typeof sub === "object" ? sub.status : null;
    const active = session.status === "complete" && (status === "trialing" || status === "active");

    if (!userId || !active) {
      res.status(200).json({ pro: false });
      return;
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    await admin
      .from("profiles")
      .update({ is_pro: true, stripe_customer_id: String(session.customer || "") })
      .eq("id", userId);
    res.status(200).json({ pro: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Activation failed" });
  }
}
