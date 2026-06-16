import { describe, it, expect } from "vitest";
import { project, closedFormCumulative, effectiveRate, annualUsage, solarRateFromMonthly, withDerivedRate, savedByYear, totalsThrough, npvOfSavings, blendedRates, co2TonsAvoided } from "./math";
import type { Assumptions } from "../types";

const base: Assumptions = {
  solarMonthly: 135,
  ppaRate: 0.18,
  ppaEscalator: 0.0299,
  gridRate: 0.33,
  gridEscalator: 0.1,
  offset: 1,
  annualKwh: 9000,
  termYears: 25,
  batteryEnabled: false,
  batteryAnnualValue: 0,
};

describe("project()", () => {
  it("matches the closed-form geometric series at 10 and 25 years", () => {
    const p = project(base);
    expect(p.cumulative10).toBeCloseTo(closedFormCumulative(base, 10), 4);
    expect(p.cumulative25).toBeCloseTo(closedFormCumulative(base, 25), 4);
  });

  it("computes year-1 monthly as annual / 12", () => {
    const p = project(base);
    expect(p.year1Monthly).toBeCloseTo(p.year1Annual / 12, 6);
  });

  it("lines never cross back", () => {
    const p = project(base);
    for (let i = 1; i < p.rows.length; i++) {
      expect(p.rows[i].gap).toBeGreaterThan(p.rows[i - 1].gap);
    }
  });

  it("cumulative is the running sum of annual savings", () => {
    const p = project(base);
    let running = 0;
    for (const row of p.rows) {
      running += row.savings;
      expect(row.cumulative).toBeCloseTo(running, 6);
    }
  });

  it("respects offset (half the load = half the savings)", () => {
    const full = project({ ...base, offset: 1 });
    const half = project({ ...base, offset: 0.5 });
    expect(half.cumulative25).toBeCloseTo(full.cumulative25 / 2, 4);
  });
});

describe("annualUsage()", () => {
  it("sums 12 months when a full year is present", () => {
    const months = [720, 840, 610, 590, 930, 1180, 1320, 1010, 760, 640, 880, 1100];
    const a = annualUsage(months, 720);
    expect(a.kwh).toBe(10580);
    expect(a.estimated).toBe(false);
  });

  it("estimates ×12 and flags it when under 12 months", () => {
    const a = annualUsage([1978], 1978);
    expect(a.kwh).toBe(1978 * 12);
    expect(a.estimated).toBe(true);
  });
});

describe("Solar monthly bill → rate", () => {
  it("derives $/kWh from the monthly bill and solar kWh", () => {
    expect(solarRateFromMonthly(135, 9000, 1)).toBeCloseTo(0.18, 6);
  });

  it("with 100% offset, the with-solar year-1 bill equals the entered monthly", () => {
    const a = withDerivedRate({ ...base, solarMonthly: 200, offset: 1 });
    const p = project(a);
    expect(p.monthlyWithYr1).toBeCloseTo(200, 4);
  });
});

describe("calculator analytics", () => {
  const p = project(base);

  it("savedByYear matches the cumulative rows", () => {
    expect(savedByYear(p, 10)).toBeCloseTo(p.cumulative10, 6);
    expect(savedByYear(p, 25)).toBeCloseTo(p.cumulative25, 6);
  });

  it("totals: do-nothing minus solar equals cumulative savings (no battery)", () => {
    const t = totalsThrough(p, 25);
    expect(t.without - t.withSolar).toBeCloseTo(p.cumulative25, 4);
  });

  it("NPV is positive but below the nominal savings (future discounted)", () => {
    const npv = npvOfSavings(p, 25, 0.04);
    expect(npv).toBeGreaterThan(0);
    expect(npv).toBeLessThan(p.cumulative25);
  });

  it("blended grid rate exceeds blended solar rate", () => {
    const b = blendedRates(p, 25);
    expect(b.grid).toBeGreaterThan(b.solar);
  });

  it("CO₂ avoided scales with kWh and years", () => {
    expect(co2TonsAvoided(9000, 25)).toBeCloseTo((9000 * 25 * 0.74) / 2000, 6);
  });
});

describe("effectiveRate()", () => {
  it("computes total / kWh", () => {
    expect(effectiveRate(297, 900)).toBeCloseTo(0.33, 6);
  });
  it("returns null on missing or zero inputs", () => {
    expect(effectiveRate(null, 900)).toBeNull();
    expect(effectiveRate(297, null)).toBeNull();
    expect(effectiveRate(297, 0)).toBeNull();
  });
});
