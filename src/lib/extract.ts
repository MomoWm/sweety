export type ExtractStage = "reading" | "rendering" | "ocr" | "parsing" | "done" | "error";

export interface ExtractProgress {
  stage: ExtractStage;
  progress?: number;
  message: string;
}

export type ProgressFn = (p: ExtractProgress) => void;

const MAX_EDGE = 2200;

export function resolveType(file: File): "pdf" | "image" | "unknown" {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || /\.(png|jpe?g|heic|heif|webp|gif|bmp|tiff?)$/.test(name)) return "image";
  return "unknown";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not decode image (unsupported format on this browser).")); };
    img.src = url;
  });
}

async function normalizeImage(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function ocr(source: string, onProgress: ProgressFn): Promise<string> {
  const { default: Tesseract } = await import("tesseract.js");
  const result = await Tesseract.recognize(source, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress({ stage: "ocr", progress: m.progress, message: `Reading bill… ${Math.round(m.progress * 100)}%` });
      }
    },
  });
  return result.data.text;
}

async function configurePdfWorker() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

async function extractPdf(file: File, onProgress: ProgressFn): Promise<string> {
  const pdfjs = await configurePdfWorker();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? (it as { str: string }).str : "")).join(" ") + "\n";
  }
  if (text.replace(/\s/g, "").length < 40) {
    onProgress({ stage: "rendering", message: "Scanned PDF — rendering for OCR…" });
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return ocr(canvas.toDataURL("image/jpeg", 0.92), onProgress);
  }
  return text;
}

export async function extractText(file: File, onProgress: ProgressFn): Promise<string> {
  const kind = resolveType(file);
  if (kind === "unknown") throw new Error("Unsupported file. Use a PDF, PNG, JPG, or HEIC photo.");
  if (kind === "pdf") {
    onProgress({ stage: "reading", message: "Reading PDF…" });
    return extractPdf(file, onProgress);
  }
  onProgress({ stage: "rendering", message: "Preparing photo…" });
  const dataUrl = await normalizeImage(file);
  return ocr(dataUrl, onProgress);
}
