import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** Format the animated number into a display string. */
  format: (n: number) => string;
  durationMs?: number;
  className?: string;
}

/** Animated count-up that re-runs whenever the target value changes. */
export function CountUp({ value, format, durationMs = 1100, className }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic for a premium settle.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
