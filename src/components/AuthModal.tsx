import { useState } from "react";
import { useAuth } from "../lib/auth";

const BENEFITS = [
  "Save homeowners & sync across your devices",
  "Run the cinematic Presentation mode",
  "Export branded one-page proposals",
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/** Sign up / log in. Google one-tap, or email + password (with username
 *  and password confirmation on sign-up). */
export function AuthModal({ onClose }: { onClose: () => void }) {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (isSignup) {
      if (username.trim().length < 2) {
        setError("Please pick a username (2+ characters).");
        return;
      }
      if (password !== confirm) {
        setError("Those passwords don't match.");
        return;
      }
    }
    setBusy(true);
    try {
      if (isSignup) {
        const { needsConfirm } = await signUp(email.trim(), password, username.trim());
        if (needsConfirm) {
          setInfo("Almost there — check your email to confirm, then log in.");
          setMode("signin");
        } else {
          onClose();
        }
      } else {
        await signIn(email.trim(), password);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle(); // redirects away to Google
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in isn't set up yet.");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-hair bg-snow px-4 py-3 text-graphite outline-none transition focus:border-gold";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="card reveal relative w-full max-w-sm rounded-3xl p-7 sm:p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-slate2 transition hover:text-graphite">
          ✕
        </button>

        <div className="text-center">
          <div className="text-3xl" aria-hidden>☀️</div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-graphite">
            {isSignup ? "Create your free account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-slate2">
            {isSignup ? "Save your work and unlock the full toolkit." : "Log in to your SunLedger account."}
          </p>
        </div>

        {isSignup && (
          <ul className="mt-5 space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-graphite">
                <span className="mt-0.5 text-emerald-600">✓</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={google}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-hair bg-snow px-6 py-3 text-sm font-semibold text-graphite transition hover:border-gold active:scale-95 disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-slate2">
          <div className="h-px flex-1 bg-hair" />
          or
          <div className="h-px flex-1 bg-hair" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isSignup && (
            <input
              type="text"
              autoComplete="username"
              required
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
            />
          )}
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={6}
            placeholder={isSignup ? "Password (6+ characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          {isSignup && (
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
            />
          )}

          {error && <div role="alert" className="text-sm text-ember">{error}</div>}
          {info && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-gold to-ember px-6 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-95 disabled:opacity-60"
          >
            {busy ? "One sec…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate2">
          {isSignup ? "Already have an account?" : "New to SunLedger?"}{" "}
          <button
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError("");
              setInfo("");
            }}
            className="font-semibold text-ember hover:underline"
          >
            {isSignup ? "Log in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
