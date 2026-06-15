import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { fetchProfile, fetchRepProfile, type Profile, type RepProfile } from "./account";

interface AuthState {
  user: User | null;
  session: Session | null;
  /** Subscription status + free-usage counter (null until loaded / logged out). */
  profile: Profile | null;
  /** The rep's branding (name, company, headshot…), null until loaded. */
  repProfile: RepProfile | null;
  /** True once we've actually fetched the rep profile (so onboarding can tell
   *  "no profile yet" apart from "still loading"). */
  repLoaded: boolean;
  /** True until the initial session check completes. */
  loading: boolean;
  /** Returns needsConfirm=true when Supabase requires email confirmation. */
  signUp: (email: string, password: string, username: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-read the profile (after using a credit or subscribing). */
  refreshProfile: () => Promise<void>;
  /** Re-read the rep branding (after editing it). */
  refreshRepProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repProfile, setRepProfile] = useState<RepProfile | null>(null);
  const [repLoaded, setRepLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id ?? null;

  async function refreshProfile() {
    setProfile(userId ? await fetchProfile() : null);
  }
  async function refreshRepProfile() {
    setRepProfile(userId ? await fetchRepProfile() : null);
  }

  // Load (or clear) the profile + rep branding whenever the user changes.
  useEffect(() => {
    let active = true;
    setRepLoaded(false);
    if (!userId) {
      setProfile(null);
      setRepProfile(null);
      return;
    }
    fetchProfile().then((p) => active && setProfile(p));
    fetchRepProfile().then((r) => {
      if (active) {
        setRepProfile(r);
        setRepLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        /* network/down — stay logged out, free app keeps working */
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Stored on the user record (user_metadata.username).
      options: { data: { username } },
    });
    if (error) throw error;
    // No session back means Supabase sent a confirmation email.
    return { needsConfirm: !data.session };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider
      value={{ user: session?.user ?? null, session, profile, repProfile, repLoaded, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile, refreshRepProfile }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
