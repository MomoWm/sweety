import type { BillData } from "../types";

export const SAMPLE_BILL: BillData = {
  customerName: "Jordan Rivera",
  serviceAddress: "42 Maple Street, Trumbull, CT 06611",
  accountNumber: "5100 1234 5678",
  provider: "Eversource",
  billingPeriod: "Apr 18 – May 19, 2026",
  monthlyKwh: 920,
  monthlyCharge: 303.6,
  printedSupplyRate: 0.1209,
  usageHistory: [920, 880, 760, 690, 1180, 1320, 1290, 1010, 720, 680, 740, 910],
};
