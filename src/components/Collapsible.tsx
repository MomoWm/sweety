import { useState } from "react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A tidy collapsible card — keeps advanced/optional stuff out of the way. */
export function Collapsible({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card rounded-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-graphite">{title}</div>
          {subtitle && <div className="truncate text-xs text-slate2">{subtitle}</div>}
        </div>
        <span className="ml-3 shrink-0 text-slate2">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="space-y-3 border-t border-hair px-4 py-4">{children}</div>}
    </div>
  );
}
