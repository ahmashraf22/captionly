import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Content generation needs VITE_API_URL pointing at the deployed Express
// backend. Without it in production the Dashboard still renders, but the
// generation actions are visibly disabled rather than silently failing.
const BACKEND_AVAILABLE = !import.meta.env.PROD || !!import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Business {
  id: string;
  name: string;
  type: string;
  city: string;
  country: string;
  audience: string;
  tone: string;
  description: string;
  google_bio: string | null;
}

interface Post {
  id: string;
  day_number: number;
  platform: 'Instagram' | 'Facebook';
  content: string;
}

const DAYS = Array.from({ length: 7 }, (_, i) => i + 1);

const PLATFORM_BADGE: Record<Post['platform'], string> = {
  Instagram: 'bg-pink-500/10 text-pink-300 border border-pink-500/30',
  Facebook: 'bg-blue-500/10 text-blue-300 border border-blue-500/30',
};

/** Dashboard — editorial dark studio for content generation */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState('');

  const [generatingBio, setGeneratingBio] = useState(false);
  const [bioError, setBioError] = useState('');
  const [bioCopied, setBioCopied] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [hasScrolled, setHasScrolled] = useState(false);

  const IDEAS_MAX = 300;

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 80) setHasScrolled(true);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /** Toggles whether a calendar post card is expanded (line-clamped vs. full). */
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    /** Loads the user's business + any existing posts; redirects to onboarding if no business */
    async function load() {
      if (!user) return;

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!biz) {
        navigate('/onboarding');
        return;
      }
      setBusiness(biz as Business);

      const { data: existing } = await supabase
        .from('posts')
        .select('id, day_number, platform, content')
        .eq('business_id', biz.id)
        .order('day_number', { ascending: true });

      setPosts((existing ?? []) as Post[]);
      setLoading(false);
    }
    load();
  }, [user, navigate]);

  /** Calls the server to generate 7 posts and replaces the local list with the result */
  async function handleGenerate() {
    if (!business || !BACKEND_AVAILABLE) return;
    setGenerating(true);
    setGenerateError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your session expired — please sign in again.');

      const trimmedIdeas = ideas.trim();
      const res = await fetch(`${API_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          business_id: business.id,
          ...(trimmedIdeas && { ideas: trimmedIdeas }),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Generation failed (${res.status}).`);
      }

      const { posts: newPosts } = (await res.json()) as { posts: Post[] };
      setPosts(newPosts);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate content.');
    } finally {
      setGenerating(false);
    }
  }

  /** Copies a post's text to the clipboard and flashes "Copied!" for 2 seconds */
  async function handleCopy(post: Post) {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopiedId(post.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === post.id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard may be blocked in insecure contexts — silently ignore.
    }
  }

  /** Asks the server to generate a Google Business Profile description and saves it on the business row */
  async function handleGenerateBio() {
    if (!business || !BACKEND_AVAILABLE) return;
    setGeneratingBio(true);
    setBioError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your session expired — please sign in again.');

      const res = await fetch(`${API_URL}/api/content/generate-bio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ business_id: business.id }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Bio generation failed (${res.status}).`);
      }

      const { google_bio } = (await res.json()) as { google_bio: string };
      setBusiness((prev) => (prev ? { ...prev, google_bio } : prev));
    } catch (err) {
      setBioError(err instanceof Error ? err.message : 'Failed to generate bio.');
    } finally {
      setGeneratingBio(false);
    }
  }

  /** Copies the Google bio to the clipboard and flashes "Copied!" for 2 seconds */
  async function handleCopyBio() {
    if (!business?.google_bio) return;
    try {
      await navigator.clipboard.writeText(business.google_bio);
      setBioCopied(true);
      setTimeout(() => setBioCopied(false), 2000);
    } catch {
      // Clipboard may be blocked in insecure contexts — silently ignore.
    }
  }

  /** Logs the user out and sends them to the landing page */
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  if (loading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4 text-zinc-400">
          <svg className="h-8 w-8 animate-spin text-[#a855f7]" viewBox="0 0 24 24" fill="none">
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
          <p className="font-mono text-[10px] tracking-[0.28em] uppercase">Loading your studio…</p>
        </div>
      </div>
    );
  }

  const postsByDay = new Map<number, Post>();
  posts.forEach((p) => postsByDay.set(p.day_number, p));

  const hasPosts = posts.length > 0;
  const hasBio = !!business.google_bio;

  const stats: { label: string; value: string; icon: React.ReactNode; comingSoon?: boolean }[] = [
    {
      label: 'Posts Generated',
      value: String(posts.length),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      label: 'Posts Scheduled',
      value: '—',
      comingSoon: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 3v4M16 3v4M3 10h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: 'Google Bio',
      value: hasBio ? 'Ready' : 'Not yet',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: 'Emails Drafted',
      value: '—',
      comingSoon: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 7l9 7 9-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in flex relative">
      {/* Editorial film grain — hidden on mobile and under reduced-motion via CSS */}
      <div aria-hidden className="film-grain" />

      {/* ===== Left sidebar ===== */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.07] bg-[#0a0a0a] sticky top-0 h-screen z-10">
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link
            to="/"
            className="inline-flex items-baseline gap-1.5 text-white font-display text-[1.4rem] leading-none tracking-[-0.01em] hover:opacity-80 transition-opacity"
          >
            Captionly
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-3 font-mono text-[9px] tracking-[0.28em] uppercase text-zinc-600">
            — Studio
          </p>
          <SidebarItem
            label="Dashboard"
            active
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
          <SidebarItem
            label="Calendar"
            comingSoon
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
          <SidebarItem
            label="Posts"
            comingSoon
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
          <SidebarItem
            label="Business"
            onClick={() => navigate('/onboarding')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M3 21h18M5 21V7l7-4 7 4v14M9 9v.01M9 13v.01M9 17v.01M15 9v.01M15 13v.01M15 17v.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </nav>

        <div className="p-3 border-t border-white/[0.07] space-y-3">
          <div className="relative rounded-2xl border border-[#7c3aed]/25 bg-gradient-to-br from-[#7c3aed]/10 to-[#a855f7]/[0.03] p-4 overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-[#7c3aed] opacity-20 blur-2xl" />
            <p className="relative font-mono text-[9px] tracking-[0.26em] uppercase text-[#a855f7]">
              — Pro Tip
            </p>
            <p className="relative mt-2 text-xs text-zinc-300 leading-relaxed">
              Regenerate anytime to get a <span className="font-display italic text-white">fresh take</span> in your tone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/[0.07] bg-[#0a0a0a]/85 backdrop-blur sticky top-0 z-10">
          <Link
            to="/"
            className="inline-flex items-baseline gap-1.5 text-white font-display text-xl leading-none hover:opacity-80 transition-opacity"
          >
            Captionly
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
          <main className="space-y-8">
            {/* TOP — welcome + actions */}
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 animate-fade-up">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                    § 01 — Studio
                  </span>
                  <span className="h-px w-8 bg-zinc-800" />
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] uppercase text-[#a855f7]">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-[#a855f7] animate-ping opacity-75" />
                      <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
                    </span>
                    Live
                  </span>
                </div>
                <h1
                  className="font-display tracking-[-0.02em] leading-[0.95]"
                  style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)' }}
                >
                  Welcome back,
                  <br />
                  <span className="italic text-[#a855f7]">{business.name}</span>.
                </h1>
                <p className="mt-4 text-sm sm:text-base text-zinc-400">
                  Generate fresh content for your{' '}
                  <span className="text-white">{business.type.toLowerCase()}</span> in seconds.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 sm:flex-shrink-0">
                {hasPosts && BACKEND_AVAILABLE && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`}
                    >
                      <path
                        d="M4 4v6h6M20 20v-6h-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 10A8 8 0 0 0 6.34 6.34L4 9M4 14a8 8 0 0 0 13.66 3.66L20 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Regenerate
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !BACKEND_AVAILABLE}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white pl-5 pr-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#a855f7] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-500"
                >
                  {generating ? (
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
                      Generating…
                    </>
                  ) : !BACKEND_AVAILABLE ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                      Generation pending
                    </>
                  ) : (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-[#7c3aed] group-hover:bg-white transition-colors" />
                      Generate content
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="transition-transform duration-500 group-hover:translate-x-0.5"
                      >
                        <path
                          d="M1 7h12m0 0L8 2m5 5l-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </header>

            {generateError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 animate-fade-in">
                {generateError}
              </div>
            )}

            {!BACKEND_AVAILABLE && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-amber-300 mb-1.5">
                  — Heads up
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Content generation is <span className="text-white">temporarily unavailable</span>{' '}
                  on this preview. You can still view existing posts, your Google bio, and business
                  info. Generation will come back online once the backend is deployed.
                </p>
              </div>
            )}

            {/* TWO-COLUMN BODY */}
            <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-6">
              {/* LEFT — ideas + calendar */}
              <div className="space-y-6 min-w-0 animate-fade-up">
                {/* Ideas */}
                <section className="relative rounded-2xl border border-white/[0.08] bg-[#0f0f10] p-5 overflow-hidden">
                  <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#7c3aed] opacity-10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <label
                        htmlFor="ideas"
                        className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] uppercase text-zinc-500"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
                        What to post about
                        <span className="text-zinc-700 normal-case tracking-normal font-body">— optional</span>
                      </label>
                      <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
                        {ideas.length}/{IDEAS_MAX}
                      </span>
                    </div>
                    <textarea
                      id="ideas"
                      rows={2}
                      value={ideas}
                      onChange={(e) => setIdeas(e.target.value.slice(0, IDEAS_MAX))}
                      placeholder="e.g. We're running a summer sale this week, 20% off everything..."
                      maxLength={IDEAS_MAX}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]/60 hover:border-white/15 transition-all resize-none"
                    />
                  </div>
                </section>

                {/* Calendar */}
                <section>
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-2">
                        § 02 — Content Calendar
                      </p>
                      <h2 className="font-display text-3xl sm:text-4xl tracking-[-0.015em] leading-[1]">
                        Your next <span className="italic text-zinc-400">seven days</span>.
                      </h2>
                    </div>
                    <span className="hidden sm:inline-flex items-center font-mono text-[10px] tracking-[0.22em] uppercase rounded-full bg-[#7c3aed]/10 text-[#a855f7] px-3 py-1.5 border border-[#7c3aed]/30">
                      Week 1
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DAYS.map((day) => {
                      const post = postsByDay.get(day);
                      if (!post) {
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating || !BACKEND_AVAILABLE}
                            className="group rounded-2xl border border-dashed border-white/[0.10] bg-[#0a0a0a] hover:bg-[#0f0f10] hover:border-[#7c3aed]/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[260px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0a0a0a] disabled:hover:border-white/[0.10]"
                          >
                            <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-600 group-hover:text-zinc-500">
                              Day
                            </span>
                            <span className="mt-1 font-display text-7xl text-zinc-700 group-hover:text-[#a855f7] tabular-nums leading-none transition-colors duration-500">
                              {day}
                            </span>
                            <span className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 group-hover:bg-[#7c3aed]/20 group-hover:border-[#7c3aed]/40 text-zinc-500 group-hover:text-[#a855f7] transition-colors">
                              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                <path
                                  d="M12 5v14M5 12h14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                            <span className="mt-3 text-sm font-medium text-zinc-500 group-hover:text-white transition-colors">
                              {BACKEND_AVAILABLE ? 'Generate this day' : 'Coming soon'}
                            </span>
                          </button>
                        );
                      }
                      const isCopied = copiedId === post.id;
                      const isExpanded = expandedIds.has(post.id);
                      const showToggle = post.content.length > 200;
                      return (
                        <article
                          key={post.id}
                          className="group rounded-2xl border border-white/[0.08] bg-[#0f0f10] hover:border-[#7c3aed]/40 p-5 transition-all flex flex-col min-h-[260px] animate-pop"
                        >
                          {/* Header — serif day numeral + platform pill */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                                Day
                              </p>
                              <p className="mt-1 font-display text-[3.5rem] text-white tabular-nums leading-[0.85]">
                                {post.day_number}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase font-semibold ${PLATFORM_BADGE[post.platform]}`}
                            >
                              {post.platform}
                            </span>
                          </div>

                          {/* Content */}
                          <p
                            className={`mt-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap flex-1 ${
                              isExpanded ? '' : 'line-clamp-3'
                            }`}
                          >
                            {post.content}
                          </p>

                          {/* Footer */}
                          <div className="mt-4 flex items-center justify-between gap-3">
                            {showToggle ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(post.id)}
                                className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] uppercase font-semibold text-[#a855f7] hover:text-[#c084fc] transition-colors"
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                >
                                  <path
                                    d="M6 9l6 6 6-6"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <span />
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopy(post)}
                              aria-live="polite"
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase font-semibold border transition-all ${
                                isCopied
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-[#7c3aed]/50 hover:text-white hover:bg-[#7c3aed]/10'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                                    <path
                                      d="M5 12l5 5L20 7"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  Copied
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                                    <rect
                                      x="9"
                                      y="9"
                                      width="11"
                                      height="11"
                                      rx="2"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                    <path
                                      d="M5 15V5a2 2 0 012-2h10"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* RIGHT — stats + bio + business */}
              <aside className="space-y-5 min-w-0 animate-fade-up">
                {/* Stats label */}
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                  § 03 — Studio Stats
                </p>

                <div className="space-y-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className={`relative rounded-xl border border-white/[0.07] bg-[#0f0f10] p-4 transition-all flex items-center gap-4 ${
                        stat.comingSoon ? 'opacity-50' : 'hover:border-[#7c3aed]/40'
                      }`}
                    >
                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border flex-shrink-0 ${
                          stat.comingSoon
                            ? 'bg-white/[0.02] border-white/[0.06] text-zinc-700'
                            : 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#a855f7]'
                        }`}
                      >
                        {stat.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-display text-2xl leading-none ${stat.comingSoon ? 'text-zinc-600' : 'text-white'}`}
                        >
                          {stat.value}
                        </p>
                        <p className="mt-1.5 font-mono text-[9px] tracking-[0.24em] uppercase text-zinc-500 truncate">
                          {stat.label}
                        </p>
                      </div>
                      {stat.comingSoon && (
                        <span className="font-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-[#a855f7] bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full px-2 py-0.5 flex-shrink-0">
                          Soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Google Bio */}
                <section className="relative rounded-2xl border border-white/[0.08] bg-[#0f0f10] p-5 overflow-hidden">
                  <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-[#a855f7] opacity-10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                        § 04 — Google Bio
                      </p>
                      {hasBio && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                            <path
                              d="M5 12l5 5L20 7"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Ready
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl tracking-[-0.01em] text-white leading-tight">
                      Your <span className="italic text-[#a855f7]">storefront</span> paragraph.
                    </h3>

                    {bioError && (
                      <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
                        {bioError}
                      </div>
                    )}

                    {hasBio ? (
                      <>
                        <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-3 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                          {business.google_bio}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
                            {business.google_bio?.length ?? 0}/750
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleCopyBio}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase font-semibold border transition-all ${
                                bioCopied
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-[#7c3aed]/50 hover:text-white'
                              }`}
                            >
                              {bioCopied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              type="button"
                              onClick={handleGenerateBio}
                              disabled={generatingBio || !BACKEND_AVAILABLE}
                              className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase font-semibold text-zinc-300 hover:border-white/20 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                              {generatingBio ? 'Working…' : !BACKEND_AVAILABLE ? 'Pending' : 'Regenerate'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          A 400–700 char paragraph for your Google Business Profile.
                        </p>
                        <button
                          type="button"
                          onClick={handleGenerateBio}
                          disabled={generatingBio || !BACKEND_AVAILABLE}
                          className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-[#0a0a0a] hover:bg-[#a855f7] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-500"
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${!BACKEND_AVAILABLE ? 'bg-amber-400' : 'bg-[#7c3aed] group-hover:bg-white'} transition-colors`} />
                          {generatingBio ? 'Generating…' : !BACKEND_AVAILABLE ? 'Generation pending' : 'Generate bio'}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* Business info */}
                <section className="relative rounded-2xl border border-white/[0.08] bg-[#0f0f10] p-5 overflow-hidden">
                  <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#7c3aed] opacity-10 blur-2xl" />
                  <div className="relative">
                    <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
                      § 05 — Business Info
                    </p>
                    <h3 className="font-display text-2xl tracking-[-0.01em] text-white leading-tight truncate">
                      {business.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                      {business.type}
                    </p>

                    <dl className="mt-5 space-y-3">
                      <SidebarRow
                        label="Location"
                        value={`${business.city}, ${business.country}`}
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                            <path
                              d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        }
                      />
                      <SidebarRow
                        label="Tone"
                        value={business.tone}
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                            <path
                              d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z"
                              fill="currentColor"
                            />
                          </svg>
                        }
                      />
                      <SidebarRow
                        label="Audience"
                        value={business.audience}
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                            <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
                            <path
                              d="M2 20a7 7 0 0114 0M16 11a3 3 0 100-6M22 20a6 6 0 00-4-5.7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        }
                      />
                    </dl>

                    <button
                      type="button"
                      onClick={() => navigate('/onboarding')}
                      className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[10px] tracking-[0.22em] uppercase font-semibold text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                        <path
                          d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4L16.5 3.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Edit business
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </main>
        </div>
      </div>

      {/* Scroll-for-more hint */}
      <div
        aria-hidden
        className={`pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-500 ${
          hasScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10]/90 backdrop-blur border border-white/10 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.22em] uppercase font-medium text-zinc-300 shadow-lg shadow-black/40">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-3 w-3 animate-bounce text-[#a855f7]"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Scroll for more
        </div>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  label: string;
  active?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
}

/** A single nav item in the left sidebar. When `comingSoon` is true, renders disabled with a "Soon" pill. */
function SidebarItem({ label, active, comingSoon, onClick, icon }: SidebarItemProps) {
  if (comingSoon) {
    return (
      <div
        aria-disabled="true"
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase font-semibold text-zinc-600 cursor-not-allowed border border-transparent select-none"
      >
        <span className="text-zinc-700">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase font-semibold text-[#a855f7] bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full px-2 py-0.5">
          Soon
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase font-semibold transition-colors ${
        active
          ? 'bg-[#7c3aed]/15 text-white border border-[#7c3aed]/30'
          : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
      }`}
    >
      <span className={active ? 'text-[#a855f7]' : 'text-zinc-500'}>{icon}</span>
      {label}
    </button>
  );
}

interface SidebarRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

/** A single icon + label + value row in the right rail's business info card */
function SidebarRow({ label, value, icon }: SidebarRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#a855f7]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="font-mono text-[9px] tracking-[0.24em] uppercase font-semibold text-zinc-500">
          {label}
        </dt>
        <dd className="text-sm font-medium text-zinc-200 break-words mt-0.5">{value}</dd>
      </div>
    </div>
  );
}
