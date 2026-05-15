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

/** Signup page — editorial split-screen with serif typography and white-pill CTA */
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

  /** Validates and creates the account, then either navigates to /onboarding or shows the confirm-email state */
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
      setServerError(
        isDuplicate ? 'User is already registered' : raw || 'Failed to create account.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-[#0f0f10] px-4 py-3.5 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]/60 transition-all ${
      hasError ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 hover:border-white/20'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden animate-fade-in">
      {/* Editorial film grain — hidden on mobile and under reduced-motion via CSS */}
      <div aria-hidden className="film-grain" />

      <div className="min-h-screen grid lg:grid-cols-[6fr_5fr]">
        {/* ===== Left — Editorial brand panel ===== */}
        <aside className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-white/[0.07] overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 h-[44rem] w-[44rem] rounded-full bg-[#7c3aed] opacity-30 blur-[140px] animate-glow" />
            <div className="absolute bottom-[-10%] right-[-20%] h-[32rem] w-[32rem] rounded-full bg-[#a855f7] opacity-[0.10] blur-[140px]" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '96px 96px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 30% 40%, black 30%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 70% 60% at 30% 40%, black 30%, transparent 75%)',
            }}
          />

          {/* Top */}
          <div className="relative flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.26em] text-zinc-500 uppercase">
              § Issue 05 / 2026
            </span>
            <span className="h-px w-6 bg-zinc-700" />
            <Link
              to="/"
              className="inline-flex items-baseline gap-1.5 text-white font-display text-[1.6rem] leading-none tracking-[-0.01em]"
            >
              Captionly
              <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_12px_rgba(124,58,237,0.9)]" />
            </Link>
          </div>

          {/* Middle */}
          <div className="relative">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#a855f7] mb-6">
              — A New Subscription
            </p>
            <h1
              className="font-display tracking-[-0.02em] leading-[0.9]"
              style={{ fontSize: 'clamp(3.5rem, 7vw, 6.5rem)' }}
            >
              <span className="block">Start your</span>
              <span className="block italic text-[#a855f7]">first month</span>
              <span className="block">— on the house.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg text-zinc-400 leading-[1.55]">
              Sixty seconds of setup. Thirty days of captions, a Google bio, and email drafts —
              all in your voice.
            </p>
          </div>

          {/* Bottom */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                {['#7c3aed', '#f59e0b', '#22d3ee', '#ec4899'].map((c, i) => (
                  <span
                    key={i}
                    className="inline-block h-7 w-7 rounded-full border-2 border-[#0a0a0a]"
                    style={{ background: `linear-gradient(135deg, ${c}, #ffffff20)` }}
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                <span className="text-white">No card required</span>
              </p>
            </div>
            <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase">
              ✦ Free forever tier
            </span>
          </div>
        </aside>

        {/* ===== Right — Form panel ===== */}
        <main className="relative flex items-center justify-center px-6 py-12 sm:px-10 sm:py-16">
          <div className="w-full max-w-md animate-fade-up">
            {/* Mobile brand */}
            <div className="lg:hidden mb-10 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.26em] text-zinc-500 uppercase">
                § Issue 05
              </span>
              <span className="h-px w-6 bg-zinc-700" />
              <Link
                to="/"
                className="inline-flex items-baseline gap-1.5 text-white font-display text-[1.5rem] leading-none"
              >
                Captionly
                <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-10">
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-4">
                — {confirmEmail ? 'Check your email' : 'Create your studio'}
              </p>
              <h2 className="font-display text-5xl sm:text-[3.4rem] leading-[0.95] tracking-[-0.015em]">
                {confirmEmail ? (
                  <>
                    Almost <span className="italic text-[#a855f7]">there</span>.
                  </>
                ) : (
                  <>
                    Make it <span className="italic text-[#a855f7]">yours</span>.
                  </>
                )}
              </h2>
              <p className="mt-4 text-zinc-400">
                {confirmEmail
                  ? 'We sent a confirmation link to finish setting up your account.'
                  : 'Generate content for your business in seconds.'}
              </p>
            </div>

            {confirmEmail ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f10] p-6 sm:p-7">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/40 text-[#a855f7] mb-4">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 7l9 7 9-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-500">
                    Confirmation sent to
                  </p>
                  <p className="mt-2 font-display text-2xl text-white break-all">{confirmEmail}</p>
                  <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                    Click the link in that email to activate your account, then come back and sign
                    in.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="group w-full inline-flex items-center justify-center gap-3 text-base font-semibold text-[#0a0a0a] bg-white pl-6 pr-7 py-4 rounded-full hover:bg-[#a855f7] hover:text-white transition-all duration-500"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-[#7c3aed] group-hover:bg-white transition-colors" />
                    Go to sign in
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="transition-transform duration-500 group-hover:translate-x-1"
                    >
                      <path
                        d="M1 8h13m0 0L9 3m5 5l-5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmEmail(null)}
                    className="w-full font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-300 py-2 transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleSubmitting || submitting}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-[#0f0f10] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {googleSubmitting ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
                      />
                    </svg>
                  )}
                  {googleSubmitting ? 'Redirecting…' : 'Sign up with Google'}
                </button>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.07]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#0a0a0a] px-4 font-mono text-[10px] tracking-[0.32em] text-zinc-600 uppercase">
                      or
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block font-mono text-[10px] tracking-[0.24em] uppercase text-zinc-500 mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={inputClass(!!errors.email)}
                  />
                  {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block font-mono text-[10px] tracking-[0.24em] uppercase text-zinc-500 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      className={`${inputClass(!!errors.password)} pr-16`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 px-4 font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-[#a855f7] transition-colors"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs text-red-400">{errors.password}</p>
                  )}

                  {/* Strength indicator */}
                  {password && (
                    <div className="mt-3">
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-colors ${
                              strength.score >= i ? strength.tone : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                        Strength · <span className="text-zinc-300">{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirm"
                    className="block font-mono text-[10px] tracking-[0.24em] uppercase text-zinc-500 mb-2"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
                    }}
                    className={inputClass(!!errors.confirm)}
                  />
                  {errors.confirm && <p className="mt-2 text-xs text-red-400">{errors.confirm}</p>}
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => {
                        setTerms(e.target.checked);
                        if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                      }}
                      className="mt-1 h-4 w-4 rounded border-zinc-700 bg-[#0f0f10] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                    />
                    <span className="text-xs text-zinc-400 leading-relaxed">
                      I agree to the{' '}
                      <Link
                        to="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#a855f7] hover:text-[#c084fc] transition-colors"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#a855f7] hover:text-[#c084fc] transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.terms && <p className="mt-2 text-xs text-red-400">{errors.terms}</p>}
                </div>

                {/* Server error */}
                {serverError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 animate-fade-in">
                    {serverError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full relative inline-flex items-center justify-center gap-3 text-base font-semibold text-[#0a0a0a] bg-white pl-6 pr-7 py-4 rounded-full hover:bg-[#a855f7] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-500"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          fill="currentColor"
                        />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-[#7c3aed] group-hover:bg-white transition-colors" />
                      Create my studio
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="transition-transform duration-500 group-hover:translate-x-1"
                      >
                        <path
                          d="M1 8h13m0 0L9 3m5 5l-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {/* Switch to login */}
                <p className="text-center text-sm text-zinc-400 pt-2">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-[#a855f7] hover:text-[#c084fc] transition-colors"
                  >
                    Sign in →
                  </Link>
                </p>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
