import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface FormErrors {
  email?: string;
  password?: string;
}

/** Validates login fields */
function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

/** Login page — email + password sign-in (dark theme) */
export default function Login() {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  /** Kicks off the Google OAuth redirect flow. The browser will leave this page; on return, /auth/callback handles routing. */
  async function handleGoogle() {
    setGoogleSubmitting(true);
    setServerError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleSubmitting(false);
    }
  }

  /** Validates, signs in, then routes to /dashboard if a business exists or /onboarding otherwise */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(email, password);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      await login(email.trim(), password);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        navigate('/onboarding');
        return;
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      navigate(business ? '/dashboard' : '/onboarding');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-all ${
      hasError
        ? 'border-red-500/60 bg-red-500/5'
        : 'border-[#27272a] bg-[#1a1a1a] hover:border-zinc-700'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-12 animate-fade-in relative overflow-hidden">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-[#7c3aed] opacity-20 blur-[120px]" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link
            to="/"
            className="inline-flex items-baseline gap-1.5 text-white font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
          >
            Captionly
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">Sign in to continue to your dashboard.</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#111111] rounded-2xl border border-[#27272a] p-8 space-y-5 shadow-2xl shadow-black/40"
        >
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleSubmitting || submitting}
            className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-[#27272a] bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#27272a] hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {googleSubmitting ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
              </svg>
            )}
            {googleSubmitting ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#27272a]" /></div>
            <div className="relative flex justify-center"><span className="bg-[#111111] px-3 text-xs text-zinc-500 uppercase tracking-wide">or</span></div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              className={inputClass(!!errors.email)}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Password</label>
              <button
                type="button"
                onClick={() => alert('Password reset is coming soon. Contact support@captionly.app for help.')}
                className="text-xs font-medium text-[#a855f7] hover:text-[#c084fc]"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`${inputClass(!!errors.password)} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-zinc-500 hover:text-[#a855f7]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 animate-fade-in">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/30 hover:shadow-xl hover:shadow-[#7c3aed]/40 hover:from-[#6d28d9] hover:to-[#9333ea] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 focus:ring-offset-[#111111] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign in'}
          </button>

          {/* Switch to signup */}
          <p className="text-center text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#a855f7] hover:text-[#c084fc]">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
