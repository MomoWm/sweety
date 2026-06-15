import { useAuth } from "../lib/auth";
import { FREE_PRESENTATIONS } from "../lib/account";

/** Header account control: "Log in" when signed out; email + "Log out" in. */
export function AccountControl({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="rounded-full border border-hair bg-snow/80 px-4 py-2 text-sm font-semibold text-graphite transition hover:border-gold active:scale-95"
      >
        Log in
      </button>
    );
  }

  const label = (user.user_metadata?.username as string | undefined) || user.email;
  const remaining = Math.max(0, FREE_PRESENTATIONS - (profile?.presentations_used ?? 0));

  return (
    <div className="flex items-center gap-2">
      {profile?.is_pro ? (
        <span className="rounded-full bg-gradient-to-r from-gold to-ember px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          ✦ Pro
        </span>
      ) : (
        profile && (
          <span className="hidden rounded-full border border-hair bg-snow/80 px-2.5 py-1 text-[11px] font-semibold text-slate2 sm:inline">
            {remaining} free this month
          </span>
        )
      )}
      <span
        className="hidden max-w-[160px] truncate text-sm font-medium text-slate2 sm:inline"
        title={user.email ?? ""}
      >
        {label}
      </span>
      <button
        onClick={() => signOut()}
        className="rounded-full border border-hair bg-snow/80 px-4 py-2 text-sm font-medium text-slate2 transition hover:border-gold hover:text-graphite active:scale-95"
      >
        Log out
      </button>
    </div>
  );
}
