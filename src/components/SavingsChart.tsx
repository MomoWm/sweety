import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Projection } from "../types";
import { usd } from "../lib/format";

interface Props {
  projection: Projection;
  mode?: "annual" | "cumulative" | "utility";
  /** Highlighted year (1-based) — draws a marker line + dot. */
  markerYear?: number;
  provider?: string;
}

/** Grid-vs-solar chart with three views and a year marker. Apple-light. */
export function SavingsChart({ projection, mode = "annual", markerYear, provider = "Eversource" }: Props) {
  const data = projection.rows.map((r) => ({
    year: r.year,
    Grid: Math.round(r.gridCost),
    Solar: Math.round(r.solarCost),
    gap: Math.round(r.gap),
    Saved: Math.round(r.cumulative),
    Bill: Math.round(r.billWithout),
  }));
  const marked = markerYear ? data[markerYear - 1] : undefined;
  const cumulative = mode === "cumulative";
  const utility = mode === "utility";

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="goldGap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#FF6A00" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="emberFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#FF6A00" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#00000010" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "#6E6E73", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E3E3E8" }}
            tickFormatter={(v) => `Y${v}`}
            interval={4}
          />
          <YAxis
            tick={{ fill: "#6E6E73", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid #E3E3E8",
              borderRadius: 14,
              color: "#1D1D1F",
              boxShadow: "0 8px 24px -12px rgba(0,0,0,0.25)",
            }}
            formatter={(value: number | string, name: string) => [
              usd(Number(value)),
              name === "gap"
                ? "Your savings"
                : name === "Grid"
                  ? provider
                  : name === "Saved"
                    ? "Saved so far"
                    : name === "Bill"
                      ? `${provider} bill`
                      : "Solar",
            ]}
            labelFormatter={(l) => `Year ${l}`}
          />

          {utility ? (
            <Area type="monotone" dataKey="Bill" stroke="#FF6A00" strokeWidth={3} fill="url(#emberFill)" isAnimationActive animationDuration={1200} />
          ) : cumulative ? (
            <>
              <Area type="monotone" dataKey="Saved" stroke="#F5A623" strokeWidth={3} fill="url(#goldGap)" isAnimationActive animationDuration={1200} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="Solar" stackId="f" stroke="none" fill="transparent" isAnimationActive animationDuration={1300} />
              <Area type="monotone" dataKey="gap" stackId="f" stroke="none" fill="url(#goldGap)" isAnimationActive animationDuration={1300} />
              <Line type="monotone" dataKey="Grid" stroke="#FF6A00" strokeWidth={3} dot={false} isAnimationActive animationDuration={1500} />
              <Line type="monotone" dataKey="Solar" stroke="#F5A623" strokeWidth={3} dot={false} isAnimationActive animationDuration={1500} />
            </>
          )}

          {marked && (
            <>
              <ReferenceLine x={marked.year} stroke="#1D1D1F" strokeDasharray="4 4" strokeOpacity={0.35} />
              <ReferenceDot
                x={marked.year}
                y={utility ? marked.Bill : cumulative ? marked.Saved : marked.Grid}
                r={5}
                fill="#F5A623"
                stroke="#fff"
                strokeWidth={2}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
