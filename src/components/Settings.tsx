import { useState } from "react";
import { useAuth } from "../lib/auth";
import { saveRepProfile, uploadHeadshot, EMPTY_REP, type RepProfile } from "../lib/account";
import { getTheme, applyTheme, getAccent, applyAccent, type Theme } from "../lib/theme";

const ACCENTS = ["#F5A623", "#2563EB", "#16A34A", "#7C3AED", "#DC2626", "#0EA5E9", "#DB2777", "#0F172A"];

interface Props {
  onClose: () => void;
  onUpgrade: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate2">{title}</div>
      {children}
    </div>
  );
}

/** One place for the rep to customize SunLedger: appearance, brand, plan. */
export function Settings({ onClose, onUpgrade }: Props) {
  const { profile, repProfile, refreshRepProfile } = useAuth();
  const isPro = !!profile?.is_pro;

  const [theme, setTheme] = useState<Theme>(getTheme());
  const [accent, setAccent] = useState<string | null>(getAccent());
  const [form, setForm] = useState<RepProfile>({ ...EMPTY_REP, ...(repProfile ?? {}) });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof RepProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function pickTheme(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }
  function pickAccent(c: string | null) {
    if (!isPro) return;
    setAccent(c);
    applyAccent(c);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadHeadshot(file);
    if (url) setForm((f) => ({ ...f, headshot_url: url }));
    setUploading(false);
  }

  async function saveBrand() {
    setBusy(true);
    await saveRepProfile(form);
    await refreshRepProfile();
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const inputCls = "w-full rounded-xl border border-hair bg-snow px-4 py-2.5 text-graphite outline-none transition focus:border-gold";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="card reveal relative w-full max-w-md overflow-y-auto rounded-3xl p-7 sm:p-8" style={{ maxHeight: "90vh" }}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-slate2 transition hover:text-graphite">✕</button>
        <h2 className="text-xl font-bold tracking-tight text-graphite">Settings</h2>

        <div className="mt-6 space-y-7">
          {/* Appearance */}
          <Section title="Appearance">
            <div className="inline-flex rounded-full border border-hair bg-cloud p-1">
              {(["light", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => pickTheme(t)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                    theme === t ? "bg-snow text-graphite shadow-card" : "text-slate2 hover:text-graphite"
                  }`}
                >
                  {t === "light" ? "☀️ Light" : "🌙 Dark"}
                </button>
              ))}
            </div>
          </Section>

          {/* Subscription + Pro perks */}
          <Section title="Plan">
            {isPro ? (
              <div className="rounded-2xl border border-gold/40 bg-gold/[0.06] p-4">
                <div className="text-sm font-bold text-graphite">✦ SunLedger Pro</div>
                <p className="mt-1 text-xs text-slate2">Unlimited presentations · white-label proposals · your brand color.</p>
                <div className="mt-3">
                  <div className="mb-1.5 text-xs font-semibold text-slate2">Your brand color</div>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((c) => (
                      <button
                        key={c}
                        onClick={() => pickAccent(c === "#F5A623" ? null : c)}
                        aria-label={`Accent ${c}`}
                        className={`h-7 w-7 rounded-full border-2 transition ${
                          (accent ?? "#F5A623") === c ? "border-graphite scale-110" : "border-transparent"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-hair p-4">
                <div className="text-sm font-bold text-graphite">Go Pro — $21.95/mo</div>
                <p className="mt-1 text-xs text-slate2">Unlimited presentations, <strong>white-label proposals</strong> (no SunLedger tag), and <strong>your own brand color</strong>. 7-day free trial.</p>
                <button
                  onClick={onUpgrade}
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-gold to-ember px-5 py-2.5 text-sm font-bold text-white shadow-glow transition active:scale-95"
                >
                  Start free trial
                </button>
              </div>
            )}
          </Section>

          {/* Your brand */}
          <Section title="Your brand">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-hair bg-cloud">
                {form.headshot_url ? (
                  <img src={form.headshot_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">🙂</div>
                )}
              </div>
              <label className="cursor-pointer rounded-full border border-hair bg-snow px-4 py-2 text-sm font-semibold text-graphite transition hover:border-gold">
                {uploading ? "Uploading…" : "Upload headshot"}
                <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <input className={inputCls} placeholder="Full name" value={form.full_name ?? ""} onChange={set("full_name")} />
              <input className={inputCls} placeholder="Company" value={form.company ?? ""} onChange={set("company")} />
              <input className={inputCls} inputMode="tel" placeholder="Phone" value={form.phone ?? ""} onChange={set("phone")} />
              <input className={inputCls} placeholder="License # (optional)" value={form.license ?? ""} onChange={set("license")} />
              <input className={inputCls} placeholder="Tagline (e.g. Your local solar guy)" value={form.tagline ?? ""} onChange={set("tagline")} />
              <div>
                <div className="mb-1 text-xs font-semibold text-slate2">Your shareable link</div>
                <div className="flex items-center rounded-xl border border-hair bg-snow px-3 py-2.5">
                  <span className="text-sm text-slate2">sunledger.vercel.app/</span>
                  <input
                    className="flex-1 bg-transparent text-graphite outline-none"
                    placeholder="yourname"
                    value={form.handle ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveBrand}
              disabled={busy}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-gold to-ember px-6 py-3 text-sm font-bold text-white shadow-glow transition active:scale-95 disabled:opacity-60"
            >
              {busy ? "Saving…" : saved ? "Saved ✓" : "Save brand"}
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}
