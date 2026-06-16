# ☀️ SunLedger

**The kitchen-table closing tool for residential solar reps. Drop a homeowner's electric bill, and in ~60 seconds you've got a cinematic, lease-focused savings story — branded to you — that closes deals.**

🔗 **Live app: <https://sunledger.vercel.app>**

### Who it's for
Residential solar sales reps who want to stop fumbling savings math at the table and start closing with a pitch that *feels* like a $250/mo tool.

### The promise (one clear flow)
Upload the bill → it reads on-device in seconds → a 25-year savings story animates → one tap launches a full-screen cinematic presentation → the homeowner leaves with a one-page proposal branded to that rep.

### Pricing
Free to start — **3 full presentations per month.** **Pro is $21.95/mo** (7-day free trial): unlimited presentations, white-label proposals, your own brand color, and your saved homeowner pipeline synced across devices.

---

## How it stays free (the core constraint)

| Job | How SunLedger does it | Cost |
|-----|----------------------|------|
| **Read PDF bills** | [pdf.js](https://mozilla.github.io/pdf.js/) extracts the text layer, parsed with tuned regex/heuristics across ~15 utility layouts | $0 |
| **Read scanned / photo bills** (PNG/JPG/HEIC) | Normalized via `<canvas>` to JPEG, then [Tesseract.js](https://tesseract.projectnaptha.com/) OCR — fully client-side | $0 |
| **Charts & math** | [Recharts](https://recharts.org/) + a small typed math engine, unit-tested against a closed-form geometric series | $0 |
| **Hosting** | Static files → Cloudflare Pages / Netlify / Vercel free tier | $0 |

There is **no LLM API anywhere** — bill reading is entirely local and completes without any key, and the app makes **no external lookups** (it never searches the customer up; every value comes from the bill itself). OCR downloads its English language model once from a free public CDN, then caches it.

The parser is validated against real residential bills from Eversource, United Illuminating, and PSE&G, and recognizes Eversource, United Illuminating, PSE&G, National Grid, Con Edison, NYSEG, PG&E, SCE, SDG&E, ComEd, Duke Energy, Dominion, FPL, and Georgia Power (with a manual "Other utility" fallback). It survives the PDF's letter-spacing noise — where "Total" prints as "T otal" and the service address sits next to a separate mailing address — using a whitespace-tolerant "flex" matcher and service-address prioritization.

---

## Run it locally

```bash
npm install
npm run dev
```

Open the printed URL (default <http://localhost:5173>). To test the iPad experience, open it from your iPad on the same Wi-Fi using your computer's LAN IP, or use your browser's responsive/device mode at an iPad viewport.

```bash
npm run build     # type-check + production build to /dist
npm run preview   # serve the built /dist locally
npm test          # run the math + parser unit tests
```

---

## Deploy free (step-by-step)

The app builds to plain static files in `dist/`, so any free static host works.

### Cloudflare Pages
1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo. Set **Build command** = `npm run build`, **Build output directory** = `dist`.
4. **Save and Deploy.** Done — you get a free `*.pages.dev` URL with HTTPS.

### Netlify
1. Push to GitHub.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. **Build command** = `npm run build`, **Publish directory** = `dist`. Deploy.

*(Or drag-and-drop the `dist/` folder onto <https://app.netlify.com/drop> after `npm run build` — no Git needed.)*

### Vercel
1. Push to GitHub.
2. Vercel → **Add New → Project** → import the repo.
3. Framework preset **Vite** is auto-detected (build `npm run build`, output `dist`). Deploy.

---

## What it does

It's a **drop-in tool**: set the solar price → drop the bill → everything auto-fills → present. Three steps, and the only things you ever type are the solar plan's monthly price and its offset.

- **iPad/iPhone-bulletproof upload** — a real `<label htmlFor>` wrapping a hidden `<input type="file">` (never a JS `.click()`, which iOS Safari blocks), `accept` for PDF/PNG/JPG/HEIC, `change`+`input` handlers, filename shown instantly, HEIC/empty-`type` resolved by filename and normalized via canvas, and a watchdog for the iOS "Preparing file…" iCloud delay.
- **Auto-fill from the bill** — customer name, *service* address (not the mailing address), account number, billing period, total monthly kWh, total monthly charge, and the printed supply rate are read automatically. All fields stay editable in collapsible cards, and **manual entry always works with no upload.**
- **Two independent escalators** — the utility rate starts from the bill (override anytime) and rises at *any* percent you set (with neutral-% presets); the solar plan rises on its own separate escalator (2.99% / 3.5% / custom). Tap-to-type number fields select-all on focus so any keyboard — iPhone, iPad, Mac, Windows — replaces the value cleanly.
- **Front-and-center inputs** — the solar monthly price and the **solar offset** (0–200%) sit on the first screen; rate and utility controls tuck into an "Adjust rates & utility" card. The app computes year-1 monthly, 10-yr and 25-yr cumulative savings, and the never-cross-back behavior — all live as you move the inputs.
- **Premium, animated experience** — cinematic dark UI with an aurora glow, an animated solar-panel array that "charges", count-up hero numbers, and a gold-filled 25-year grid-vs-solar chart that draws in. A fullscreen **Presentation** mode runs a six-slide pitch — including a cinematic "catch-up" animation where the utility line climbs until it overtakes the locked-in solar line — and a clean printable one-page proposal via `window.print()`. Save/recall multiple homeowners in `localStorage`.

---

## Architecture

```
src/
├── lib/
│   ├── math.ts        # Savings model + closed-form geometric series
│   ├── math.test.ts   # Proves the model against the closed form
│   ├── parser.ts      # Multi-utility bill parser (flex/compact matchers)
│   ├── parser.test.ts # Tested against real Eversource / UI / PSE&G text
│   ├── extract.ts     # pdf.js + Tesseract.js pipeline (lazy-loaded)
│   ├── storage.ts     # localStorage save/recall
│   ├── format.ts      # $ / ¢ / kWh / % formatting
│   └── defaults.ts    # Grid rate + model defaults
├── components/        # Uploader, ProviderSelect, SolarPriceField,
│                      # SolarBillControl, RateSettings, Calculator,
│                      # SavingsChart, PanelArray, ComparisonCard,
│                      # MarketRates, UsageBreakdown, CustomerDetails,
│                      # AdvancedAssumptions, Proposal, PresentationMode,
│                      # SavedHomeowners, Collapsible, TypeableField, CountUp
├── types.ts           # Shared domain types
├── App.tsx            # Composition + state (start screen / results)
└── main.tsx
```

**Stack:** Vite + React + TypeScript (strict), Tailwind CSS, Recharts, pdf.js, Tesseract.js. Single-page app, no backend.

**Code-splitting keeps the first paint light.** The build splits vendors into long-cached chunks (`react`, `charts`) so day-to-day app edits don't bust them; `PresentationMode` is lazy-loaded only when you tap **Present**; and the heavy `pdf.js` + Tesseract pipeline is dynamically imported only when a bill is actually read.

---

## The math, proven

`src/lib/math.test.ts` checks the iterative projection (`project()`) against a closed-form geometric-series sum (`closedFormCumulative()`) at 10 and 25 years across several input sets, plus year-1 identities, the monotonically-widening gap (lines never cross back), offset scaling, and the battery resilience add. Run `npm test`.

---

## License

**Proprietary — © 2026 momowm. All rights reserved.** This is not open-source
software; see [LICENSE](LICENSE). No copying, distribution, or reuse without
written permission.

Estimates only — not a binding offer. Verify rates and incentives for each customer.
