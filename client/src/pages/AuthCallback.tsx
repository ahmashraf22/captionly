import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Reads the OAuth `error_description` (if any) from the URL hash or query
 * once on mount. Returns null if nothing went wrong on the OAuth provider's side.
 */
function readUrlError(): string | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const errDesc = hashParams.get('error_description') ?? queryParams.get('error_description');
  return errDesc ? decodeURIComponent(errDesc) : null;
}

/**
 * OAuth landing page. Supabase auto-detects the session in the URL hash on load,
 * fires onAuthStateChange, and AuthContext picks up the user. We then route
 * based on whether the user already has a business profile.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Frozen on first render — the URL won't change while we sit on this page.
  const urlError = readUrlError();

  // If auth has resolved (loading=false) but we still have no user and no
  // explicit URL error, the OAuth flow failed silently or was cancelled.
  const sessionError = !loading && !user && !urlError ? 'We could not sign you in. Please try again.' : null;
  const error = urlError ?? sessionError;

  // Once authenticated, decide where to send them.
  useEffect(() => {
    if (loading || error || !user) return;

    let cancelled = false;
    async function route() {
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (cancelled) return;
      navigate(business ? '/dashboard' : '/onboarding', { replace: true });
    }
    route();
    return () => {
      cancelled = true;
    };
  }, [user, loading, error, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-[#7c3aed] opacity-15 blur-[120px]" />

      <div className="relative max-w-md w-full text-center animate-fade-up">
        <span className="inline-flex items-baseline gap-1.5 text-white font-bold text-xl tracking-tight">
          Captionly
          <span className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
        </span>

        {error ? (
          <div className="mt-8 bg-[#111111] rounded-2xl border border-[#27272a] p-8 space-y-4">
            <h1 className="text-xl font-bold">Sign-in failed</h1>
            <p className="text-sm text-zinc-400 break-words">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/30 hover:shadow-xl hover:shadow-[#7c3aed]/40 hover:from-[#6d28d9] hover:to-[#9333ea] transition-all"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 text-zinc-400">
            <svg className="h-8 w-8 animate-spin text-[#a855f7]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
            </svg>
            <p className="text-sm">Signing you in…</p>
          </div>
        )}
      </div>
    </div>
  );
}
