export const usd = (n: number, decimals = 0): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(n) ? n : 0);

export const cents = (perKwh: number): string => `${(perKwh * 100).toFixed(1)}¢`;

export const kwh = (n: number): string =>
  `${new Intl.NumberFormat("en-US").format(Math.round(n))} kWh`;

export const pct = (frac: number): string => `${(frac * 100).toFixed(2)}%`;
