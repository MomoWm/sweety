import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Uploader } from "./components/Uploader";
import { SolarBillControl } from "./components/SolarBillControl";
import { Calculator } from "./components/Calculator";
import { PanelArray } from "./components/PanelArray";
import { CustomerDetails } from "./components/CustomerDetails";
import { ComparisonCard } from "./components/ComparisonCard";
import { RateSettings } from "./components/RateSettings";
import { MarketRates } from "./components/MarketRates";
import { UtilityPanel } from "./components/UtilityPanel";
import { ProviderSelect } from "./components/ProviderSelect";
import { Collapsible } from "./components/Collapsible";
import { SolarPriceField } from "./components/SolarPriceField";
import { SolarPriceQuickSet } from "./components/SolarPriceQuickSet";
// Fullscreen pitch overlay — only needed when "Present" is tapped, so we
// split it (and its animation code) into a chunk loaded on demand.
const PresentationMode = lazy(() =>
  import("./components/PresentationMode").then((m) => ({ default: m.PresentationMode }))
);
import { AdvancedAssumptions } from "./components/AdvancedAssumptions";
import { UsageBreakdown } from "./components/UsageBreakdown";
import { SavedHomeowners } from "./components/SavedHomeowners";
import { Proposal } from "./components/Proposal";
import { CountUp } from "./components/CountUp";
import { Welcome } from "./components/Welcome";
import { AuthModal } from "./components/AuthModal";
import { AccountControl } from "./components/AccountControl";
import { UpgradeModal } from "./components/UpgradeModal";
import { Settings } from "./components/Settings";
import { getAccent, applyAccent, getTheme, toggleTheme } from "./lib/theme";
import { LandingPage } from "./components/LandingPage";
import { ClosingTools } from "./components/ClosingTools";
import { BreakEven } from "./components/BreakEven";
import { EmotionalClose } from "./components/EmotionalClose";
import { SAMPLE_BILL } from "./lib/sample";
import { useAuth } from "./lib/auth";
import {
  requestPresentation,
  startCheckout,
  activateCheckout,
  listCloudHomeowners,
  saveCloudHomeowner,
  deleteCloudHomeowner,
  updateHomeownerMeta,
  touchPresented,
  fetchRepByHandle,
} from "./lib/account";
import type { RepProfile, HomeownerRecord } from "./lib/account";
import { Pipeline } from "./components/Pipeline";
import { project, annualUsage, withDerivedRate, solarRateFromMonthly, effectiveRate, totalsThrough } from "./lib/math";
import { usd } from "./lib/format";
import { DEFAULT_ASSUMPTIONS, EMPTY_BILL, GRID_RATE } from "./lib/defaults";
import {
  loadHomeowners,
  saveHomeowner,
  deleteHomeowner,
  newId,
} from "./lib/storage";
import type { Assumptions, BillData, SavedHomeowner } from "./types";

const WELCOMED_KEY = "sunledger.welcomed.v1";
const ENTERED_KEY = "sunledger.entered.v1";
const ONBOARDED_KEY = "sunledger.onboarded.v1";

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">☀️</span>
      <span className="text-xl font-bold tracking-tight text-graphite">
        Sun<span className="accent-text">Ledger</span>
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card rounded-2xl p-3 text-center sm:rounded-3xl sm:p-6">
      <CountUp
        value={value}
        format={(n) => usd(n)}
        className="tnum block font-bold leading-none text-graphite text-[clamp(0.85rem,4vw,2.25rem)]"
      />
      <div className="mt-1.5 text-[0.68rem] font-medium uppercase tracking-wide text-slate2 sm:text-sm">
        {label}
      </div>
    </div>
  );
}

export default function App() {
  const [bill, setBill] = useState<BillData>(EMPTY_BILL);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [saved, setSaved] = useState<HomeownerRecord[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [view, setView] = useState<"solar" | "utility">("utility");
  const [presenting, setPresenting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [proBanner, setProBanner] = useState(false);
  // A rep's brand, loaded when a homeowner arrives via a shareable link (/<rep>).
  const [sharedRep, setSharedRep] = useState<RepProfile | null>(null);
  const { user, session, profile, repProfile, repLoaded, refreshProfile } = useAuth();
  // True once the rep sets the Eversource rate by hand — then a bill upload
  // won't overwrite it (the printed bill may pre-date a rate increase).
  const [rateOverridden, setRateOverridden] = useState(false);
  // Greet first-time visitors once (then never again on this device).
  const [showWelcome, setShowWelcome] = useState(
    () => typeof localStorage !== "undefined" && !localStorage.getItem(WELCOMED_KEY),
  );
  // Show the marketing landing page first; returning users skip straight to the tool.
  const [entered, setEntered] = useState(() => {
    try {
      return localStorage.getItem(ENTERED_KEY) === "1";
    } catch {
      return false;
    }
  });

  function enterApp() {
    try {
      localStorage.setItem(ENTERED_KEY, "1");
    } catch {
      /* ignore */
    }
    setEntered(true);
    dismissWelcome(); // the landing already oriented them — no double modal
  }

  function demoFromLanding() {
    enterApp();
    loadSample();
  }

  // Logged in → the homeowner pipeline lives in the cloud (cache-proof, synced
  // across devices). Logged out → local storage only.
  const uid = user?.id ?? null;
  useEffect(() => {
    let active = true;
    if (uid) {
      listCloudHomeowners().then((list) => active && setSaved(list));
    } else {
      setSaved(loadHomeowners());
    }
    return () => {
      active = false;
    };
  }, [uid]);

  // Apply any saved Pro brand accent once on load.
  useEffect(() => {
    applyAccent(getAccent());
  }, []);

  // Shareable rep link: /<handle> loads that rep's brand for the homeowner.
  useEffect(() => {
    const seg = window.location.pathname.split("/").filter(Boolean)[0];
    if (!seg || seg.includes(".") || ["api", "assets", "r"].includes(seg)) return;
    fetchRepByHandle(seg).then((r) => r && setSharedRep(r));
  }, []);

  // First-time onboarding: once after signup, build the rep's brand.
  useEffect(() => {
    if (!user || !repLoaded || repProfile?.full_name) return;
    try {
      if (localStorage.getItem(ONBOARDED_KEY)) return;
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowBrand(true);
  }, [user, repLoaded, repProfile]);

  async function handleDelete(id: string) {
    if (user) {
      await deleteCloudHomeowner(id);
      setSaved(await listCloudHomeowners());
    } else {
      setSaved(deleteHomeowner(id));
    }
  }

  async function handleMeta(id: string, patch: { status?: string | null; notes?: string | null }) {
    await updateHomeownerMeta(id, patch);
    setSaved(await listCloudHomeowners());
  }

  function dismissWelcome() {
    try {
      localStorage.setItem(WELCOMED_KEY, "1");
    } catch {
      // private mode / storage disabled — fine, we just greet again next time
    }
    setShowWelcome(false);
  }

  function loadSample() {
    dismissWelcome();
    handleParsed(SAMPLE_BILL);
    window.scrollTo({ top: 0 });
  }

  // The 3-free-presentations gate. Free presentations require an account so the
  // count is tracked server-side (clearing the browser cache can't reset it).
  async function handlePresent() {
    if (profile?.is_pro) {
      setPresenting(true);
      return;
    }
    // If logged in, ask the server (monthly gate, enforced server-side).
    // If not logged in (e.g. GitHub Pages / local dev), the API 401s and
    // requestPresentation already fails-open → allowed:true.
    const token = session?.access_token ?? "";
    const r = await requestPresentation(token);
    if (r.allowed) {
      await refreshProfile();
      if (currentId) {
        touchPresented(currentId).then(() => listCloudHomeowners().then(setSaved));
      }
      setPresenting(true);
    } else {
      setShowUpgrade(true);
    }
  }

  async function handleSubscribe() {
    if (!user) {
      setShowUpgrade(false);
      setShowAuth(true);
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      await startCheckout(user.id, user.email ?? null); // redirects to Stripe
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Could not start checkout.");
      setCheckoutBusy(false);
    }
  }

  // Returning from Stripe Checkout: confirm the session and unlock Pro.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") {
      if (params.get("checkout") === "cancel") {
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }
    const sessionId = params.get("session_id");
    window.history.replaceState({}, "", window.location.pathname);
    if (!sessionId) return;
    activateCheckout(sessionId).then(async (pro) => {
      if (pro) {
        await refreshProfile();
        setProBanner(true);
      }
    });
    // Run once on mount (the URL param is consumed immediately above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setGridRate(v: number) {
    setAssumptions((a) => ({ ...a, gridRate: v }));
    setRateOverridden(true);
  }

  const effAssumptions = useMemo(() => withDerivedRate(assumptions), [assumptions]);
  const projection = useMemo(() => project(effAssumptions), [effAssumptions]);
  const impliedCents =
    solarRateFromMonthly(assumptions.solarMonthly, assumptions.annualKwh, assumptions.offset) *
    100;

  function handleParsed(parsed: BillData) {
    // Keep the rep's selected utility if the bill didn't clearly name one.
    setBill({ ...parsed, provider: parsed.provider || bill.provider || "Eversource" });
    const au = annualUsage(parsed.usageHistory, parsed.monthlyKwh);
    const annualKwh = au.kwh || assumptions.annualKwh;
    // Start the grid at THIS customer's real all-in rate (total ÷ kWh) so the
    // "today" bill matches what they actually pay — unless the rep already set
    // the current rate by hand (e.g. a rate hike after the bill was printed).
    const gridRate = rateOverridden
      ? assumptions.gridRate
      : effectiveRate(parsed.monthlyCharge, parsed.monthlyKwh) ?? GRID_RATE;
    setAssumptions((a) => ({
      ...a,
      annualKwh,
      gridRate,
      // Seed Solar bill ~15% below today's average; rep overrides with the quote.
      solarMonthly: Math.round((annualKwh * gridRate * 0.85) / 12),
    }));
    setStarted(true);
  }

  function handleNew() {
    setBill(EMPTY_BILL);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setCurrentId(null);
    setStarted(false);
    setRateOverridden(false);
    setView("utility");
  }

  async function handleSave() {
    const id = currentId ?? newId();
    const record = { id, savedAt: Date.now(), bill, assumptions };
    if (user) {
      await saveCloudHomeowner(record);
      setSaved(await listCloudHomeowners());
    } else {
      setSaved(saveHomeowner(record));
    }
    setCurrentId(id);
  }

  function handleLoad(r: SavedHomeowner) {
    setBill(r.bill);
    setAssumptions(r.assumptions);
    setCurrentId(r.id);
    setRateOverridden(true);
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const provider = bill.provider || "Eversource";
  const setProvider = (p: string) => setBill((b) => ({ ...b, provider: p }));

  const eyebrow = [bill.customerName, townOf(bill.serviceAddress)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative min-h-screen">
      <div className="backdrop print:hidden" aria-hidden />

      {!started && showWelcome && (
        <Welcome onTrySample={loadSample} onClose={dismissWelcome} />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showBrand && (
        <Settings
          onClose={() => setShowBrand(false)}
          onUpgrade={() => {
            setShowBrand(false);
            handleSubscribe();
          }}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onSubscribe={handleSubscribe}
          busy={checkoutBusy}
          error={checkoutError}
        />
      )}

      {proBanner && (
        <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4 print:hidden">
          <div className="flex items-center gap-3 rounded-full border border-gold/40 bg-snow px-5 py-3 shadow-lift">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-semibold text-graphite">
              You're SunLedger Pro — unlimited everything is unlocked.
            </span>
            <button onClick={() => setProBanner(false)} aria-label="Dismiss" className="text-slate2 hover:text-graphite">
              ✕
            </button>
          </div>
        </div>
      )}

      {!entered && !started ? (
        <LandingPage onStart={enterApp} onDemo={demoFromLanding} onLogin={() => setShowAuth(true)} rep={sharedRep} />
      ) : (

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between gap-2 print:hidden">
          <Wordmark />
          <div className="flex items-center gap-2">
            {started && (
              <>
                <SolarPriceQuickSet
                  value={assumptions.solarMonthly}
                  onChange={(v) => setAssumptions((a) => ({ ...a, solarMonthly: v }))}
                />
                <button
                  onClick={handlePresent}
                  className="rounded-full bg-gradient-to-r from-gold to-ember px-4 py-2 text-sm font-bold text-white shadow-glow transition active:scale-95"
                >
                  ▶ Present
                </button>
                <button
                  onClick={handleNew}
                  className="rounded-full border border-hair bg-snow/80 px-4 py-2 text-sm font-medium text-slate2 transition hover:border-gold hover:text-graphite"
                >
                  New bill
                </button>
              </>
            )}
            {user && (
              <button
                onClick={() => setShowBrand(true)}
                aria-label="Settings"
                className="flex h-9 items-center gap-2 rounded-full border border-hair bg-snow/80 px-2.5 text-sm font-medium text-slate2 transition hover:border-gold hover:text-graphite"
              >
                {repProfile?.headshot_url ? (
                  <img src={repProfile.headshot_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span>⚙</span>
                )}
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
            <button
              onClick={() => toggleTheme()}
              aria-label="Toggle dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hair bg-snow/80 text-base transition hover:border-gold"
            >
              {getTheme() === "dark" ? "☀️" : "🌙"}
            </button>
            <AccountControl onOpenAuth={() => setShowAuth(true)} />
          </div>
        </header>

        {!started ? (
          /* ---------------- HERO STATE ---------------- */
          <div className="relative pt-10 sm:pt-16">
            <div className="sun-soft" aria-hidden />
            <div className="relative mx-auto max-w-2xl text-center reveal">
              <div className="mb-4 inline-block rounded-full border border-hair bg-snow/70 px-3 py-1 text-xs font-medium text-slate2">
                See what you're really paying for power
              </div>
              <h1 className="tight text-5xl font-bold leading-[1.04] text-graphite sm:text-7xl">
                Turn a bill into a
                <br />
                <span className="accent-text">25-year savings story.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-md text-lg text-slate2">
                Drop any electric bill. SunLedger reads it instantly — right on
                this device — and shows exactly what solar saves.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-xl reveal" style={{ animationDelay: "0.1s" }}>
              <Uploader onParsed={handleParsed} locked={!user} onLocked={() => setShowAuth(true)} />
              <div className="mt-4 flex flex-col items-center gap-2.5">
                <button
                  onClick={loadSample}
                  className="rounded-full border border-hair bg-snow/80 px-5 py-2 text-sm font-semibold text-graphite shadow-card transition hover:border-gold active:scale-95"
                >
                  ✨ No bill handy? Try a sample
                </button>
                <button
                  onClick={() => (user ? setStarted(true) : setShowAuth(true))}
                  className="text-sm font-medium text-slate2 underline-offset-4 transition hover:text-graphite hover:underline"
                >
                  or enter the numbers manually →
                </button>
              </div>
            </div>

            {/* Step 2: solar price (visible) + optional rate tweaks (tucked away) */}
            <div className="mx-auto mt-6 max-w-xl space-y-3 reveal" style={{ animationDelay: "0.15s" }}>
              <SolarPriceField
                value={assumptions.solarMonthly}
                onChange={(v) => setAssumptions((a) => ({ ...a, solarMonthly: v }))}
                offset={assumptions.offset}
                onOffset={(v) => setAssumptions((a) => ({ ...a, offset: v }))}
              />
              <Collapsible title="⚙ Adjust rates & utility" subtitle="optional — the bill usually fills this in">
                <ProviderSelect value={provider} onChange={setProvider} />
                <RateSettings
                  rate={assumptions.gridRate}
                  eversource={assumptions.gridEscalator}
                  solar={assumptions.ppaEscalator}
                  offset={assumptions.offset}
                  onRate={setGridRate}
                  onEversource={(v) => setAssumptions((a) => ({ ...a, gridEscalator: v }))}
                  onSolar={(v) => setAssumptions((a) => ({ ...a, ppaEscalator: v }))}
                  onOffset={(v) => setAssumptions((a) => ({ ...a, offset: v }))}
                  provider={provider}
                  showOffset={false}
                />
              </Collapsible>
            </div>

            <div className="mx-auto mt-6 max-w-xl text-center text-sm text-slate2 reveal" style={{ animationDelay: "0.2s" }}>
              <span className="font-semibold text-graphite">1.</span> Drop the bill ·{" "}
              <span className="font-semibold text-graphite">2.</span> Type the solar price ·{" "}
              <span className="font-semibold text-graphite">3.</span> Tap ▶ Present
            </div>

            <div className="mx-auto mt-10 max-w-2xl reveal" style={{ animationDelay: "0.2s" }}>
              <PanelBanner intensity={0.6} caption="Reads your bill on-device · no servers · no cost" />
            </div>

            {saved.length > 0 && (
              <div className="mx-auto mt-10 max-w-2xl reveal">
                {user ? (
                  <Pipeline list={saved} onLoad={handleLoad} onDelete={handleDelete} onMeta={handleMeta} />
                ) : (
                  <SavedHomeowners list={saved} onLoad={handleLoad} onDelete={handleDelete} onSave={handleSave} onImported={setSaved} hideSave />
                )}
              </div>
            )}
          </div>
        ) : (
          /* ---------------- RESULTS STATE ---------------- */
          <div className="space-y-6 sm:space-y-8">
            {/* Top view toggle */}
            <div className="flex justify-center reveal print:hidden">
              <div className="inline-flex rounded-full border border-hair bg-snow p-1 shadow-card">
                {([
                  ["utility", "Cost of doing nothing"],
                  ["solar", "With solar"],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-full px-5 py-2.5 text-sm font-bold transition sm:px-7 sm:text-base ${
                      view === v
                        ? v === "solar"
                          ? "bg-gradient-to-r from-gold to-ember text-white shadow-glow"
                          : "bg-ink text-white"
                        : "text-slate2 hover:text-graphite"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {eyebrow && (
              <div className="-mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate2 reveal">
                {eyebrow}
              </div>
            )}

            {/* Keyed on `view` so the hero numbers and charts re-animate
                each time the homeowner flips between the two stories. */}
            <div key={view} className="space-y-6 sm:space-y-8">
            {view === "utility" ? (
              <>
                {/* Utility hero */}
                <section className="relative pb-1 pt-2 text-center reveal">
                  <CountUp
                    value={totalsThrough(projection, 25).without}
                    format={(n) => usd(n)}
                    className="tnum block text-5xl font-bold leading-none text-ember sm:text-7xl"
                  />
                  <div className="mt-4 text-lg text-slate2 sm:text-xl">
                    paid to {provider} over the next 25 years
                  </div>
                </section>

                <div className="grid grid-cols-3 gap-3 reveal sm:gap-4">
                  <Stat label="Avg bill / mo today" value={projection.monthlyWithoutYr1} />
                  <Stat label="By year 25 / mo" value={(projection.rows[24]?.billWithout ?? 0) / 12} />
                  <Stat label="Paid over 25 yrs" value={totalsThrough(projection, 25).without} />
                </div>

                <div className="reveal">
                  <UtilityPanel projection={projection} assumptions={assumptions} provider={provider} />
                </div>
              </>
            ) : (
              <>
                {/* Solar hero */}
                <section className="relative pb-1 pt-2 text-center reveal">
                  <div className="sun-soft" aria-hidden />
                  <div className="relative">
                    <CountUp
                      value={projection.cumulative25}
                      format={(n) => usd(n)}
                      className="accent-text tnum block text-6xl font-bold leading-none sm:text-8xl"
                    />
                    <div className="mt-4 text-lg text-slate2 sm:text-xl">
                      saved over 25 years vs. {provider}
                    </div>
                    <div className="mx-auto mt-5 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-hair bg-snow/80 px-4 py-2 text-sm shadow-card">
                      <span className="font-bold text-ember">
                        ${Math.round(projection.monthlyWithoutYr1)}/mo
                      </span>
                      <span className="text-slate2">{provider}</span>
                      <span className="text-slate2">→</span>
                      <span className="font-bold text-graphite">
                        ${Math.round(assumptions.solarMonthly)}/mo
                      </span>
                      <span className="text-slate2">Solar</span>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-3 gap-3 reveal sm:gap-4">
                  <Stat label="Per month, year 1" value={projection.year1Monthly} />
                  <Stat label="First 10 years" value={projection.cumulative10} />
                  <Stat label="Full 25 years" value={projection.cumulative25} />
                </div>

                <div className="reveal">
                  <PanelBanner
                    intensity={assumptions.offset}
                    caption={`Solar covers ${Math.round(assumptions.offset * 100)}% of this home's power`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
                  <div className="reveal lg:col-span-2">
                    <SolarBillControl
                      value={assumptions.solarMonthly}
                      onChange={(v) => setAssumptions((a) => ({ ...a, solarMonthly: v }))}
                      impliedCents={impliedCents}
                      todayMonthly={projection.monthlyWithoutYr1}
                      provider={provider}
                    />
                  </div>
                  <div className="reveal lg:col-span-3">
                    <ComparisonCard projection={projection} provider={provider} />
                  </div>
                </div>

                <div className="reveal">
                  <Calculator projection={projection} assumptions={assumptions} provider={provider} />
                </div>

                <div className="reveal">
                  <BreakEven projection={projection} assumptions={assumptions} provider={provider} />
                </div>

                <div className="reveal">
                  <ClosingTools projection={projection} assumptions={assumptions} provider={provider} />
                </div>

                <div className="reveal">
                  <EmotionalClose projection={projection} assumptions={assumptions} provider={provider} />
                </div>
              </>
            )}
            </div>

            {/* Shared: rates (tucked), market, usage, assumptions, details */}
            <div className="reveal">
              <Collapsible
                title="⚙ Adjust rates & utility"
                subtitle={`${provider} ${(assumptions.gridRate * 100).toFixed(1)}¢, +${(assumptions.gridEscalator * 100).toFixed(1)}%/yr`}
              >
                <ProviderSelect value={provider} onChange={setProvider} />
                <RateSettings
                  rate={assumptions.gridRate}
                  eversource={assumptions.gridEscalator}
                  solar={assumptions.ppaEscalator}
                  offset={assumptions.offset}
                  onRate={setGridRate}
                  onEversource={(v) => setAssumptions((a) => ({ ...a, gridEscalator: v }))}
                  onSolar={(v) => setAssumptions((a) => ({ ...a, ppaEscalator: v }))}
                  onOffset={(v) => setAssumptions((a) => ({ ...a, offset: v }))}
                  provider={provider}
                />
              </Collapsible>
            </div>

            <div className="reveal">
              <MarketRates
                gridRate={assumptions.gridRate}
                solarRate={view === "solar" ? effAssumptions.ppaRate : 0}
                provider={provider}
              />
            </div>

            <div className="reveal">
              <UsageBreakdown
                bill={bill}
                annualKwh={assumptions.annualKwh}
                onAnnualChange={(kwh) => setAssumptions((a) => ({ ...a, annualKwh: kwh }))}
              />
            </div>

            <div className="reveal">
              <AdvancedAssumptions assumptions={assumptions} onChange={setAssumptions} provider={provider} />
            </div>

            <div className="reveal">
              <CustomerDetails bill={bill} onChange={setBill} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 reveal print:hidden">
              {view === "solar" && (
                <button
                  onClick={() => window.print()}
                  className="rounded-full bg-gradient-to-r from-gold to-ember px-7 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-95"
                >
                  Save 1-page PDF
                </button>
              )}
              <button
                onClick={handleSave}
                className="rounded-full border border-hair bg-snow px-7 py-3.5 text-sm font-semibold text-graphite transition active:scale-95 hover:border-gold"
              >
                {currentId ? "Update saved" : "Save homeowner"}
              </button>
            </div>

            {saved.length > 0 && (
              <div className="reveal">
                {user ? (
                  <Pipeline list={saved} onLoad={handleLoad} onDelete={handleDelete} onMeta={handleMeta} />
                ) : (
                  <SavedHomeowners list={saved} onLoad={handleLoad} onDelete={handleDelete} onSave={handleSave} onImported={setSaved} hideSave />
                )}
              </div>
            )}

            {view === "solar" && (
              <div className="reveal">
                <Proposal bill={bill} assumptions={effAssumptions} projection={projection} rep={repProfile ?? sharedRep} pro={!!profile?.is_pro} />
              </div>
            )}
          </div>
        )}

        <footer className="mt-14 text-center text-xs text-slate2 print:hidden">
          100% on-device · no servers · no API keys · estimates only, not a binding offer
        </footer>
      </div>
      )}

      {presenting && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#0A0A0F]" />}>
          <PresentationMode
            customerName={bill.customerName}
            provider={provider}
            monthlyBill={projection.monthlyWithoutYr1}
            monthlyWithYr1={projection.monthlyWithYr1}
            monthlyWithYr10={projection.monthlyWithYr10}
            monthlyWithoutYr1={projection.monthlyWithoutYr1}
            monthlyWithoutYr10={projection.monthlyWithoutYr10}
            year1MonthlySavings={projection.year1Monthly}
            year1AnnualSavings={projection.year1Annual}
            cumulative10={projection.cumulative10}
            cumulative25={projection.cumulative25}
            lifetimeUtility={totalsThrough(projection, 25).without}
            gridEscalator={assumptions.gridEscalator}
            rep={repProfile ?? sharedRep}
            onExit={() => setPresenting(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

/** A premium full-width solar-panel banner with a soft caption. */
function PanelBanner({
  intensity,
  caption,
}: {
  intensity: number;
  caption: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl">
      <PanelArray intensity={intensity} />
      <div className="mt-2.5 text-center text-xs font-medium text-slate2">
        {caption}
      </div>
    </div>
  );
}

/** Pull the town out of a "Street, Town, CT ZIP" address. */
function townOf(address: string): string {
  const m = address.match(/,\s*([A-Za-z .]+),\s*CT/i);
  return m ? m[1].trim() : "";
}
