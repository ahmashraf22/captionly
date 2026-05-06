import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  tone: string;
}

/** Computes a 0-4 score based on length and character class diversity */
function scorePassword(password: string): PasswordStrength {
  if (!password || password.length < 6) {
    return { score: 0, label: 'Too short', tone: 'bg-zinc-700' };
  }
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrength['label'][] = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const tones = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
  return { score: clamped, label: labels[clamped], tone: tones[clamped] };
}

/** Validates signup fields */
function validate(email: string, password: string, confirm: string, terms: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (!confirm) errors.confirm = 'Please confirm your password.';
  else if (password !== confirm) errors.confirm = 'Passwords do not match.';
  if (!terms) errors.terms = 'Please accept the Terms of Service to continue.';
  return errors;
}

/** Signup page — creates a Supabase account, then redirects to onboarding (dark theme) */
export default function Signup() {
  const navigate = useNavigate();
  const { signup, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  /** Kicks off the Google OAuth redirect flow. The browser will leave this page; on return, /auth/callback handles routing. */
  async function handleGoogle() {
    setGoogleSubmitting(true);
    setServerError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Google sign-up failed.');
      setGoogleSubmitting(false);
    }
  }

  /** Validates and creates the account, then either navigates to /onboarding (instant session) or shows a "check your email" success state (email confirmation enabled in Supabase) */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(email, password, confirm, terms);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      const trimmedEmail = email.trim();
      const { session } = await signup(trimmedEmail, password);
      if (session) {
        navigate('/onboarding');
      } else {
        setConfirmEmail(trimmedEmail);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const isDuplicate = /already\s*registered|already\s*exists|user\s*exists/i.test(raw);
      setServerError(isDuplicate ? 'User is already registered' : (raw || 'Failed to create account.'));
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
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {confirmEmail ? 'Check your email' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {confirmEmail
                ? 'We sent a confirmation link to finish setting up your account.'
                : 'Start generating content for your business in seconds.'}
            </p>
          </div>
        </div>

        {confirmEmail ? (
          <div className="bg-[#111111] rounded-2xl border border-[#27272a] p-8 text-center shadow-2xl shadow-black/40 space-y-5">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/40 text-[#a855f7]">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 7l9 7 9-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-zinc-300">
                We sent a confirmation link to
              </p>
              <p className="mt-1 text-base font-semibold text-white break-all">{confirmEmail}</p>
              <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                Click the link in that email to activate your account, then come back and sign in.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                className="w-full rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/30 hover:shadow-xl hover:shadow-[#7c3aed]/40 hover:from-[#6d28d9] hover:to-[#9333ea] transition-all"
              >
                Go to login
              </Link>
              <button
                type="button"
                onClick={() => setConfirmEmail(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (

        /* Card */
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
                <path className="opacity-75" d="M4 12a8 8 0 008 8v4a4 4 0 00-4 4H4z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
              </svg>
            )}
            {googleSubmitting ? 'Redirecting…' : 'Sign up with Google'}
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
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
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

            {/* Strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-colors ${
                        strength.score >= i ? strength.tone : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Strength: <span className="font-medium text-zinc-300">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm password</label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => {
                setConfirm(e.target.value);
                if (errors.confirm) setErrors(prev => ({ ...prev, confirm: undefined }));
              }}
              className={inputClass(!!errors.confirm)}
            />
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
          </div>

          {/* Terms of Service */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={terms}
                onChange={e => {
                  setTerms(e.target.checked);
                  if (errors.terms) setErrors(prev => ({ ...prev, terms: undefined }));
                }}
                className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-[#1a1a1a] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
              />
              <span className="text-xs text-zinc-400 leading-relaxed">
                I agree to the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#a855f7] hover:text-[#c084fc]"
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#a855f7] hover:text-[#c084fc]"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.terms && <p className="mt-1 text-xs text-red-400">{errors.terms}</p>}
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
                Creating account…
              </span>
            ) : 'Create account'}
          </button>

          {/* Switch to login */}
          <p className="text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#a855f7] hover:text-[#c084fc]">
              Login
            </Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
