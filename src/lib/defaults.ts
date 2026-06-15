import type { Assumptions, BillData } from "../types";

/** Eversource grid rate is fixed at 33¢/kWh — the one constant in the model. */
export const GRID_RATE = 0.33;

/** CT-accurate model defaults. The only number the rep changes is the solar rate. */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  solarMonthly: 135, // Solar bill price ($/mo) — the rep enters the quote.
  ppaRate: 0.18, // Derived from the monthly bill; seed value.
  ppaEscalator: 0.0299, // 2.99% PPA escalator.
  gridRate: GRID_RATE, // Locked at 33¢.
  gridEscalator: 0.045, // 4.5%/yr — believable default; slide up to 20% as needed.
  offset: 1, // 100% of usage covered by solar.
  annualKwh: 9000, // Auto-filled from the bill (monthly kWh × 12).
  termYears: 25,
  batteryEnabled: false,
  batteryAnnualValue: 300,
};

export const EMPTY_BILL: BillData = {
  customerName: "",
  serviceAddress: "",
  accountNumber: "",
  provider: "Eversource",
  billingPeriod: "",
  monthlyKwh: null,
  monthlyCharge: null,
  printedSupplyRate: null,
  usageHistory: [],
};
