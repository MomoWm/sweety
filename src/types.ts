export interface BillData {
  customerName: string;
  serviceAddress: string;
  accountNumber: string;
  provider: string;
  billingPeriod: string;
  monthlyKwh: number | null;
  monthlyCharge: number | null;
  printedSupplyRate: number | null;
  usageHistory: number[];
}

export interface Assumptions {
  solarMonthly: number;
  ppaRate: number;
  ppaEscalator: number;
  gridRate: number;
  gridEscalator: number;
  offset: number;
  annualKwh: number;
  termYears: number;
  batteryEnabled: boolean;
  batteryAnnualValue: number;
}

export interface YearRow {
  year: number;
  gridRate: number;
  solarRate: number;
  gridCost: number;
  solarCost: number;
  savings: number;
  gap: number;
  cumulative: number;
  billWithout: number;
  billWith: number;
}

export interface Projection {
  rows: YearRow[];
  year1Monthly: number;
  year1Annual: number;
  cumulative10: number;
  cumulative25: number;
  lifetimeUtility: number;
  lifetimeSolar: number;
  effectiveRate: number;
  monthlyWithoutYr1: number;
  monthlyWithYr1: number;
  monthlyWithoutYr10: number;
  monthlyWithYr10: number;
}

export interface SavedHomeowner {
  id: string;
  savedAt: number;
  bill: BillData;
  assumptions: Assumptions;
}
