import { useEffect, useRef, useState } from "react";
import { extractText, resolveType } from "../lib/extract";
import type { ExtractProgress } from "../lib/extract";
import { parseBill } from "../lib/parser";
import type { BillData } from "../types";

interface Props {
  onParsed: (bill: BillData) => void;
  compact?: boolean;
  /** When locked (not signed in), uploading prompts sign-in instead. */
  locked?: boolean;
  onLocked?: () => void;
}

const ACCEPT = "image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.heic,.heif,.webp";

export function Uploader({ onParsed, compact, locked, onLocked }: Props) {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<ExtractProgress | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const watchdog = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(watchdog.current), []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setFileName(file.name);

    if (resolveType(file) === "unknown") {
      setError("Use a PDF, PNG, JPG, or HEIC photo of the bill.");
      return;
    }

    setStatus({ stage: "reading", message: "Opening bill…" });
    watchdog.current = window.setTimeout(() => {
      setStatus((s) =>
        s && s.stage === "reading"
          ? { ...s, message: "Pulling the file from iCloud — one sec…" }
          : s,
      );
    }, 4000);

    try {
      const text = await extractText(file, setStatus);
      window.clearTimeout(watchdog.current);
      setStatus({ stage: "parsing", message: "Reading your numbers…" });
      onParsed(parseBill(text));
      setStatus({ stage: "done", message: "Done" });
    } catch (e) {
      window.clearTimeout(watchdog.current);
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
      setStatus({ stage: "error", message: "Couldn't read it automatically." });
    }
  }

  const busy = status != null && status.stage !== "done" && status.stage !== "error";

  return (
    <div className="space-y-3">
      <label
        htmlFor="bill-file"
        onClick={(e) => {
          if (locked) {
            e.preventDefault();
            onLocked?.();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (locked) {
            onLocked?.();
            return;
          }
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-snow text-center transition active:scale-[0.99] ${
          compact ? "px-5 py-6" : "px-6 py-14"
        } ${
          dragging
            ? "border-gold shadow-glow"
            : "border-hair hover:border-gold/70 hover:shadow-card"
        }`}
      >
        {!busy && (
          <>
            <div
              className={`mb-3 transition group-hover:scale-110 ${
                compact ? "text-3xl" : "text-6xl"
              }`}
            >
              ☀️
            </div>
            <div
              className={`font-bold text-graphite ${
                compact ? "text-base" : "text-xl"
              }`}
            >
              {locked
                ? "Sign in to read a bill"
                : compact
                  ? "Upload another bill"
                  : "Drop the electric bill here"}
            </div>
            {!compact && (
              <div className="mt-2 text-sm text-slate2">
                {locked
                  ? "Free account · 3 full presentations a month"
                  : "PDF or photo · reads instantly · 100% on this device"}
              </div>
            )}
          </>
        )}

        {busy && (
          <div className="w-full max-w-sm" role="status" aria-live="polite">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-3 w-3 animate-ping rounded-full bg-gold" />
              <span className="text-sm text-graphite">{status?.message}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-hair">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-ember transition-all"
                style={{
                  width:
                    typeof status?.progress === "number"
                      ? `${Math.round(status.progress * 100)}%`
                      : "40%",
                }}
              />
            </div>
          </div>
        )}

        <input
          id="bill-file"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
          onInput={(e) => handleFile((e.target as HTMLInputElement).files?.[0])}
        />
      </label>

      {fileName && !busy && (
        <div className="flex items-center gap-2 text-sm text-slate2">
          <span className="text-gold">●</span>
          <span className="truncate">{fileName}</span>
          {status?.stage === "done" && (
            <span className="font-medium text-emerald-600">✓ read</span>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-ember/40 bg-ember/[0.06] px-4 py-3 text-sm text-ember">
          {error} You can still type the numbers below.
        </div>
      )}
    </div>
  );
}
