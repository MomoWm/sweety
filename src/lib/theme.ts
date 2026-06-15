export type Theme = "light" | "dark";

const KEY = "sunledger.theme";

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(t: Theme): void {
  document.documentElement.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem(KEY, t);
  } catch {}
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

const ACCENT_KEY = "sunledger.accent";

export function getAccent(): string | null {
  try {
    return localStorage.getItem(ACCENT_KEY);
  } catch {
    return null;
  }
}

export function applyAccent(color: string | null): void {
  const root = document.documentElement.style;
  try {
    if (color) {
      root.setProperty("--accent", color);
      root.setProperty("--accent2", color);
      localStorage.setItem(ACCENT_KEY, color);
    } else {
      root.removeProperty("--accent");
      root.removeProperty("--accent2");
      localStorage.removeItem(ACCENT_KEY);
    }
  } catch {}
}
