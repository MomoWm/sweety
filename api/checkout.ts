// Vercel Serverless Function: creates a Stripe Checkout Session for the
// $21.95/mo SunLedger Pro subscription (with a 7-day free trial).
// Runs only on Vercel (not in local dev). Requires env vars:
//   STRIPE_SECRET_KEY   (secret)
//   STRIPE_PRICE_ID     (the recurring $21.95/mo price id, e.g. price_...)
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { userId, email, origin } = body;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }
    const base = origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID || "", quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      client_reference_id: userId,
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: `${base}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?checkout=cancel`,
    });
    res.status(200).json({ url: session.url });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Could not start checkout" });
  }
}
