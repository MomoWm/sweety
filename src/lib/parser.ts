import type { BillData } from "../types";

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

function flex(label: string): string {
  return label.replace(/\s+/g, "").split("").map((c) => c.replace(ESCAPE, "\\$&")).join("\\s*");
}

const num = (s: string): number => Number(s.replace(/[^0-9.]/g, ""));
const JUNK = /[­​-‏‪-‮⁠﻿-]/g;
const compact = (s: string): string => s.replace(JUNK, "").replace(/\s+/g, "");

function tidy(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function rejoin(s: string, aggressive = false): string {
  const t = tidy(s).split(" ");
  const out: string[] = [];
  for (let i = 0; i < t.length; i++) {
    const cur = t[i];
    const prev = out[out.length - 1];
    const next = t[i + 1];
    const lone = /^[A-Za-z]$/.test(cur);
    const prevOk = !!prev && prev.length >= 2 && !/^\d+$/.test(prev);
    const middleInitial = lone && prevOk && !!next && next.length >= 2;
    if (lone && prevOk && (aggressive || !middleInitial)) {
      out[out.length - 1] = prev + cur;
    } else {
      out.push(cur);
    }
  }
  return out.join(" ");
}

function cleanName(s: string, aggressive = false): string {
  return rejoin(s, aggressive).toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function parseKwh(text: string): number | null {
  const c = compact(text);
  const ok = (v: number) => v >= 20 && v <= 50000;
  const cm = c.match(/electricuse(?:was)?([0-9][0-9,]*)kwh/i);
  if (cm && ok(num(cm[1]))) return num(cm[1]);
  const m = text.match(new RegExp(flex("Monthly kWh Use") + "\\s*([0-9][0-9,]*)", "i"));
  if (m && ok(num(m[1]))) return num(m[1]);
  const g = c.match(/(?:total)?kwh(?:used|use)([0-9][0-9,]{1,5})/i) || c.match(/([0-9][0-9,]{1,5})kwh(?:used|use)/i);
  if (g && ok(num(g[1]))) return num(g[1]);
  return null;
}

export function parseCharge(text: string): number | null {
  const c = compact(text);
  const amt = "([0-9][0-9,]*\\.[0-9]{2})";
  const pick = (re: string): number | null => {
    const m = c.match(new RegExp(re, "i"));
    if (m) {
      const v = num(m[1]);
      if (v > 0 && v < 100000) return v;
    }
    return null;
  };
  const tcc = pick("totalcurrentcharges\\$?" + amt) || pick("\\$?" + amt + "totalcurrentcharges");
  if (tcc != null) return tcc;
  return (
    pick("totalamountdue\\$?" + amt) ??
    pick("amountnowdue\\$?" + amt) ??
    pick("amountdue\\$?" + amt) ??
    pick("pleasepay\\$?" + amt) ??
    pick("balancedue\\$?" + amt)
  );
}

export function parseSupplyRate(text: string): number | null {
  const re = new RegExp(flex("Standard Service Rate") + "\\s*:?\\s*([0-9]+\\.[0-9]+)", "i");
  const m = text.match(re);
  if (m) {
    const v = num(m[1]);
    if (v > 0 && v < 100) return v;
  }
  return null;
}

export function parseAccountNumber(text: string): string {
  const t = tidy(text);
  const m = t.match(/\b(\d{4}\s\d{3}\s\d{4})\b/);
  if (m) return m[1];
  const g = compact(text).match(/account(?:number|no\.?|#)?:?([0-9][0-9\-]{6,22}[0-9])/i);
  return g ? g[1] : "";
}

export function parseCustomerName(text: string): string {
  const t = tidy(text);
  const re = new RegExp(flex("Service Provided to:") + "\\s*([A-Z][A-Z .'\\-]+?)\\s+\\d");
  const m = t.match(re);
  if (m) return cleanName(m[1]);
  for (const lab of ["Service Location", "Customer Name", "Account Name", "Service For", "Bill To", "Name"]) {
    const gm = t.match(new RegExp(flex(lab) + "\\s*:?\\s*([A-Z][A-Z .'\\-]{3,40}?)\\s+(?:\\d|Account|Service|Svc|Bill|Meter|Page)", ""));
    if (gm) return cleanName(gm[1]);
  }
  return "";
}

const SUFFIX = "(?:RD|ROAD|ST|STREET|AVE|AVENUE|DR|DRIVE|LN|LANE|CT|COURT|WAY|BLVD|PL|PLACE|TER|TERRACE|CIR|CIRCLE|HWY|PIKE|PKWY|TRL|TRAIL|SQ|BLVD|LOOP|PATH|WALK)";
const STATE = "(?:A[LKZR]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY])";

const ADDR = new RegExp(
  `(?<![\\d.])(\\d{1,6}\\s+[A-Z][A-Za-z .'\\-]*?\\s+${SUFFIX}(?:\\s+(?:LOT|APT|UNIT|STE|FL|RM|#)\\s*[0-9A-Za-z]{1,5})?)\\s+([A-Z][A-Za-z ]+?)\\s*,?\\s+(${STATE})\\s+([0-9][0-9 \\-]{3,9})`,
);

function extractAddr(s: string): string {
  const m = s.match(ADDR);
  if (!m) return "";
  const zip = (m[4].match(/\d/g) || []).join("").slice(0, 5);
  return `${cleanName(m[1], true)}, ${cleanName(m[2], true)}, ${m[3]} ${zip}`;
}

export function parseServiceAddress(text: string): string {
  const t = tidy(text);
  for (const lab of ["Service Address", "Service Location", "Service Provided to", "Svc Addr", "Service For"]) {
    const m = t.match(new RegExp(flex(lab), "i"));
    if (m && m.index != null) {
      const a = extractAddr(t.slice(m.index, m.index + 170));
      if (a) return a;
    }
  }
  const first = extractAddr(t);
  if (first) return first;
  let street = "";
  const sm = t.match(new RegExp(flex("Svc Addr:") + "\\s*([0-9][A-Za-z0-9 .'\\-]*?)\\s+Actual", "i"));
  if (sm) street = tidy(sm[1]);
  let cityZip = "";
  const cm = t.match(new RegExp(`([A-Za-z][A-Za-z]{2,})\\s+(${STATE})\\s+(\\d{5})`));
  if (cm) cityZip = `${cleanName(cm[1])}, ${cm[2]} ${cm[3]}`;
  if (street && cityZip) return `${cleanName(street, true)}, ${cityZip}`;
  if (street) return cleanName(street, true);
  if (cityZip) return cityZip;
  return "";
}

export function parseBillingPeriod(text: string): string {
  const t = tidy(text);
  const date = "(\\d{1,2}/\\d{1,2}/\\d{2,4})";
  const sep = "\\s*(?:to|-|–|through)\\s*";
  const patterns = [
    flex("Service from") + "\\s*" + date + "\\s*-\\s*" + date,
    flex("Billing Period") + "\\s*:?\\s*" + date + sep + date,
    flex("Service Period") + "\\s*:?\\s*" + date + sep + date,
    flex("Billing Days") + "[^0-9]*" + date + sep + date,
  ];
  for (const p of patterns) {
    const m = t.match(new RegExp(p, "i"));
    if (m) return `${m[1]} – ${m[2]}`;
  }
  return "";
}

const PROVIDER_MAP: [RegExp, string][] = [
  [/eversource/i, "Eversource"],
  [/united\s+illuminating|\buinet\b|\bui\.com\b/i, "United Illuminating"],
  [/national\s+grid|nationalgrid/i, "National Grid"],
  [/pse\s*&?\s*g|public\s+service\s+e(?:lectric|nterprise)/i, "PSE&G"],
  [/con\s*ed(?:ison)?|consolidated\s+edison/i, "Con Edison"],
  [/\bnyseg\b|new\s+york\s+state\s+electric/i, "NYSEG"],
  [/pacific\s+gas|pg\s*&?\s*e\b/i, "PG&E"],
  [/southern\s+california\s+edison|\bsce\b/i, "SCE"],
  [/san\s+diego\s+gas|sdg\s*&?\s*e\b/i, "SDG&E"],
  [/duke\s+energy/i, "Duke Energy"],
  [/dominion\s+energy/i, "Dominion"],
  [/xcel\s+energy/i, "Xcel Energy"],
  [/\bcomed\b|commonwealth\s+edison/i, "ComEd"],
  [/florida\s+power|\bfpl\b/i, "FPL"],
  [/georgia\s+power/i, "Georgia Power"],
];

export function detectProvider(text: string): string {
  const hay = text + "\n" + compact(text);
  for (const [re, name] of PROVIDER_MAP) if (re.test(hay)) return name;
  return "";
}

export const PROVIDERS = [
  "Eversource", "United Illuminating", "National Grid", "PSE&G", "Con Edison",
  "NYSEG", "PG&E", "SCE", "SDG&E", "Duke Energy", "Dominion", "Xcel Energy",
  "ComEd", "FPL", "Georgia Power", "Other utility",
];

export function parseUsageHistory(text: string): number[] {
  const t = tidy(text);
  const label = t.match(new RegExp(flex("Monthly kWh Use"), "i"));
  if (!label || label.index == null) return [];
  let startIdx = label.index;
  let extended = false;
  const before = t.slice(0, label.index);
  const actuals = [...before.matchAll(/Actual\b/gi)];
  if (actuals.length) {
    const li = actuals[actuals.length - 1].index ?? -1;
    if (li >= 0 && label.index - li < 240) { startIdx = li; extended = true; }
  }
  let region = t.slice(startIdx);
  const end = region.match(new RegExp(flex("Contact Information"), "i"));
  if (end && end.index != null) region = region.slice(0, end.index);
  const values = (region.match(/\b\d{2,4}\b/g) || [])
    .map(Number)
    .filter((n) => n >= 30 && n <= 4000 && !(n >= 2020 && n <= 2030));
  if (extended && values.length >= 2 && values[0] === values[1]) values.shift();
  return values;
}

export function parseBill(raw: string): BillData {
  return {
    customerName: parseCustomerName(raw),
    serviceAddress: parseServiceAddress(raw),
    accountNumber: parseAccountNumber(raw),
    provider: detectProvider(raw),
    billingPeriod: parseBillingPeriod(raw),
    monthlyKwh: parseKwh(raw),
    monthlyCharge: parseCharge(raw),
    printedSupplyRate: parseSupplyRate(raw),
    usageHistory: parseUsageHistory(raw),
  };
}
