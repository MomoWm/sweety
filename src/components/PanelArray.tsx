interface Props {
  /** 0..1 — how strongly the sun reflects off the glass (drives the glint). */
  intensity: number;
}

const PANELS = 4;
const COLS = 6;
const ROWS = 4;

/**
 * A realistic monocrystalline solar array in SVG: dark blue-black cells with
 * busbars, aluminum frames, a glass specular sheen sweep, and a warm sun glint
 * whose strength tracks the solar offset. Tuned to read like a real Solar /
 * Tesla product shot rather than a cartoon grid.
 */
export function PanelArray({ intensity }: Props) {
  const t = Math.max(0, Math.min(1, intensity));
  const VW = 240;
  const VH = 92;
  const margin = 5;
  const gap = 3;
  const pw = (VW - margin * 2 - gap * (PANELS - 1)) / PANELS;
  const ph = VH - margin * 2;

  const cells = [];
  for (let p = 0; p < PANELS; p++) {
    const px = margin + p * (pw + gap);
    // aluminum frame
    cells.push(
      <rect
        key={`f${p}`}
        x={px}
        y={margin}
        width={pw}
        height={ph}
        rx={1.4}
        fill="#0a1320"
        stroke="url(#frame)"
        strokeWidth={0.9}
      />,
    );
    const ipad = 1.6;
    const gx = px + ipad;
    const gy = margin + ipad;
    const gw = pw - ipad * 2;
    const gh = ph - ipad * 2;
    const cw = gw / COLS;
    const ch = gh / ROWS;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = gx + c * cw;
        const y = gy + r * ch;
        cells.push(
          <rect
            key={`c${p}-${r}-${c}`}
            x={x + 0.25}
            y={y + 0.25}
            width={cw - 0.5}
            height={ch - 0.5}
            rx={0.5}
            fill="url(#cell)"
            stroke="#1d3a57"
            strokeWidth={0.25}
          />,
        );
        // two busbars per cell
        cells.push(
          <g key={`b${p}-${r}-${c}`} stroke="#33527a" strokeWidth={0.18} opacity={0.5}>
            <line x1={x + cw / 3} y1={y + 0.4} x2={x + cw / 3} y2={y + ch - 0.4} />
            <line x1={x + (2 * cw) / 3} y1={y + 0.4} x2={x + (2 * cw) / 3} y2={y + ch - 0.4} />
          </g>,
        );
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-hair bg-gradient-to-b from-[#dfe7f1] via-[#eef2f7] to-[#f7f9fc] p-3 shadow-card">
      <div style={{ perspective: "900px" }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full"
          style={{ transform: "rotateX(12deg)", transformOrigin: "center bottom" }}
        >
          <defs>
            <linearGradient id="cell" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#1b3a59" />
              <stop offset="55%" stopColor="#0c1f33" />
              <stop offset="100%" stopColor="#060f1c" />
            </linearGradient>
            <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cdd5de" />
              <stop offset="50%" stopColor="#8d97a3" />
              <stop offset="100%" stopColor="#c2cbd5" />
            </linearGradient>
            <radialGradient id="glint" cx="78%" cy="12%" r="60%">
              <stop offset="0%" stopColor="#fff3d6" stopOpacity={0.2 + t * 0.55} />
              <stop offset="35%" stopColor="#ffd27a" stopOpacity={t * 0.32} />
              <stop offset="70%" stopColor="#ffffff" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="48%" stopColor="#ffffff" stopOpacity={0.06} />
              <stop offset="52%" stopColor="#ffffff" stopOpacity={0.16} />
              <stop offset="56%" stopColor="#ffffff" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>

          {cells}

          {/* fixed diagonal glass sheen + warm sun glint */}
          <rect x={0} y={0} width={VW} height={VH} fill="url(#sheen)" />
          <rect x={0} y={0} width={VW} height={VH} fill="url(#glint)" />
        </svg>

        {/* animated specular sweep */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ animation: "sweep 5s ease-in-out infinite" }}
        >
          <div
            className="h-full w-1/4 skew-x-12"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
