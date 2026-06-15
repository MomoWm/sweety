import { describe, it, expect } from "vitest";
import { parseBill, parseKwh, parseCharge, parseSupplyRate, parseAccountNumber, detectProvider } from "./parser";

const jamesKing = `
EVERSOURCE   ENERGY
Ser vice   Provided   to:  JAMES   KING  237   982   004
Account   Number:   5168   408   0104   07/28/25
Svc   Addr:   7   APPLE   HILL   DR  Actual   1978   67115   887928682   69093
Monthly   kWh   Use  1978  Jul
JAMES   KING  LOT   19  7   APPLE   HILL   DR  CROMWELL   CT   06416
Ser vice   from   06/25/25   -   07/28/25   33   Days
Standard   Ser vice   Ra te:   9.748   ¢/kWh
Balance   Forward   $0.00   T otal   Current   Charges   $569.40   T otal   Balance   $569.40
Amount   no w   due  $569.40
`;

describe("parseBill — James King (07/28/25)", () => {
  const b = parseBill(jamesKing);
  it("kWh = 1978", () => expect(b.monthlyKwh).toBe(1978));
  it("total = $569.40", () => expect(b.monthlyCharge).toBe(569.4));
  it("supply rate = 9.748¢", () => expect(b.printedSupplyRate).toBeCloseTo(9.748, 3));
  it("provider = Eversource", () => expect(b.provider).toBe("Eversource"));
});

describe("field parsers in isolation", () => {
  it("parseKwh ignores absurd values", () => { expect(parseKwh("Monthly kWh Use 5")).toBeNull(); });
  it("parseCharge prefers 'Amount now due'", () => { expect(parseCharge("Amount no w due $123.45")).toBe(123.45); });
  it("parseSupplyRate returns cents", () => { expect(parseSupplyRate("Standard Ser vice Ra te: 11.250 ¢/kWh")).toBeCloseTo(11.25, 3); });
  it("parseAccountNumber finds the 4-3-4 group", () => { expect(parseAccountNumber("foo 1234 567 8901 bar")).toBe("1234 567 8901"); });
  it("detects many US utilities", () => {
    expect(detectProvider("EVERSOURCE ENERGY")).toBe("Eversource");
    expect(detectProvider("national grid")).toBe("National Grid");
    expect(detectProvider("Con Edison of New York")).toBe("Con Edison");
  });
});

describe("graceful failure", () => {
  it("returns blanks without throwing on junk", () => {
    const b = parseBill("nothing useful here");
    expect(b.monthlyKwh).toBeNull();
    expect(b.monthlyCharge).toBeNull();
    expect(b.customerName).toBe("");
  });
});
