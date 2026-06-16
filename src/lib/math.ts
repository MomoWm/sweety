import type { Assumptions, Projection, YearRow } from "../types";

export function project(a: Assumptions): Projection {
  const solarKwh = a.annualKwh * a.offset;
  const rows: YearRow[] = [];
  let cumulative = 0;
  let lifetimeUtility = 0;
  let lifetimeSolar = 0;

  for (let n = 1; n <= a.termYears; n++) {
    const gridRate = a.gridRate * Math.pow(1 + a.gridEscalator, n - 1);
    const solarRate = a.ppaRate * Math.pow(1 + a.ppaEscalator, n - 1);
    const gridCost = solarKwh * gridRate;
    const solarCost = solarKwh * solarRate;
    const resilience = a.batteryEnabled ? a.batteryAnnualValue : 0;
    const savings = gridCost - solarCost + resilience;
    const leftover = a.annualKwh - solarKwh;
    const billWithout = a.annualKwh * gridRate;
    const billWith = solarKwh * solarRate + leftover * gridRate;

    cumulative += savings;
    lifetimeUtility += gridCost;
    lifetimeSolar += solarCost;

    rows.push({ year: n, gridRate, solarRate, gridCost, solarCost, savings, gap: gridCost - solarCost, cumulative, billWithout, billWith });
  }

  const cumulativeThrough = (year: number) =>
    rows.filter((r) => r.year <= year).reduce((s, r) => s + r.savings, 0);

  const year1 = rows[0];
  const monthlyBills = (n: number) => {
    const gridRate = a.gridRate * Math.pow(1 + a.gridEscalator, n - 1);
    const solarRate = a.ppaRate * Math.pow(1 + a.ppaEscalator, n - 1);
    const without = (a.annualKwh * gridRate) / 12;
    const leftover = a.annualKwh - solarKwh;
    const withSolar = (solarKwh * solarRate + leftover * gridRate) / 12;
    return { without, withSolar };
  };
  const m1 = monthlyBills(1);
  const m10 = monthlyBills(10);

  return {
    rows,
    year1Monthly: year1 ? year1.savings / 12 : 0,
    year1Annual: year1 ? year1.savings : 0,
    cumulative10: cumulativeThrough(10),
    cumulative25: cumulativeThrough(25),
    lifetimeUtility,
    lifetimeSolar,
    effectiveRate: a.gridRate,
    monthlyWithoutYr1: m1.without,
    monthlyWithYr1: m1.withSolar,
    monthlyWithoutYr10: m10.without,
    monthlyWithYr10: m10.withSolar,
  };
}

export function savedByYear(p: Projection, year: number): number {
  const row = p.rows[Math.max(0, Math.min(p.rows.length, year) - 1)];
  return row ? row.cumulative : 0;
}

export function totalsThrough(p: Projection, years: number): { without: number; withSolar: number } {
  const slice = p.rows.slice(0, years);
  return {
    without: slice.reduce((s, r) => s + r.billWithout, 0),
    withSolar: slice.reduce((s, r) => s + r.billWith, 0),
  };
}

export function npvOfSavings(p: Projection, years: number, discount = 0.04): number {
  let v = 0;
  for (let n = 1; n <= years; n++) {
    const r = p.rows[n - 1];
    if (r) v += r.savings / Math.pow(1 + discount, n);
  }
  return v;
}

export function blendedRates(p: Projection, years: number): { grid: number; solar: number } {
  const slice = p.rows.slice(0, years);
  const n = slice.length || 1;
  return {
    grid: slice.reduce((s, r) => s + r.gridRate, 0) / n,
    solar: slice.reduce((s, r) => s + r.solarRate, 0) / n,
  };
}

export const LB_CO2_PER_KWH = 0.74;

export function co2TonsAvoided(annualSolarKwh: number, years: number): number {
  return (annualSolarKwh * years * LB_CO2_PER_KWH) / 2000;
}

export function closedFormCumulative(a: Assumptions, years: number): number {
  const solarKwh = a.annualKwh * a.offset;
  const G = 1 + a.gridEscalator;
  const P = 1 + a.ppaEscalator;
  const geom = (base: number) => base === 1 ? years : (Math.pow(base, years) - 1) / (base - 1);
  const grid = a.gridRate * geom(G);
  const solar = a.ppaRate * geom(P);
  const resilience = a.batteryEnabled ? a.batteryAnnualValue * years : 0;
  return solarKwh * (grid - solar) + resilience;
}

export interface AnnualUsage {
  kwh: number;
  monthsOfData: number;
  estimated: boolean;
}

export function annualUsage(usageHistory: number[], currentMonthKwh: number | null): AnnualUsage {
  const months = usageHistory.length;
  if (months >= 12) {
    const kwh = usageHistory.slice(0, 12).reduce((s, v) => s + v, 0);
    return { kwh, monthsOfData: months, estimated: false };
  }
  if (months >= 1) {
    const avg = usageHistory.reduce((s, v) => s + v, 0) / months;
    return { kwh: Math.round(avg * 12), monthsOfData: months, estimated: true };
  }
  return { kwh: currentMonthKwh ? currentMonthKwh * 12 : 0, monthsOfData: 0, estimated: true };
}

export function solarRateFromMonthly(monthly: number, annualKwh: number, offset: number): number {
  const solarKwh = annualKwh * offset;
  return solarKwh > 0 ? (monthly * 12) / solarKwh : 0;
}

export function withDerivedRate(a: Assumptions): Assumptions {
  return { ...a, ppaRate: solarRateFromMonthly(a.solarMonthly, a.annualKwh, a.offset) };
}

export function effectiveRate(monthlyCharge: number | null, monthlyKwh: number | null): number | null {
  if (!monthlyCharge || !monthlyKwh || monthlyKwh <= 0) return null;
  return monthlyCharge / monthlyKwh;
}

/** Find the year (1-based) when cumulative savings first turn positive. Returns null if never. */
export function paybackYear(p: Projection): number | null {
  for (const row of p.rows) {
    if (row.cumulative > 0) return row.year;
  }
  return null;
}
