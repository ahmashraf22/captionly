import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
  Instagram: 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
  Facebook:  'bg-blue-500/15 text-blue-300 border border-blue-500/30',
};

/** Dashboard — fetches the user's business and AI-generated posts; lets them generate more (dark theme) */
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

  // Hide the "scroll for more" hint after the user has actually scrolled.
  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 80) setHasScrolled(true);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /** Toggles whether a calendar post card is expanded (line-clamped vs. full). */
  function toggleExpand(id: string) {
    setExpandedIds(prev => {
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
    if (!business) return;
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
        setCopiedId(prev => (prev === post.id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard may be blocked in insecure contexts — silently ignore.
    }
  }

  /** Asks the server to generate a Google Business Profile description and saves it on the business row */
  async function handleGenerateBio() {
    if (!business) return;
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
      setBusiness(prev => (prev ? { ...prev, google_bio } : prev));
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
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <svg className="h-8 w-8 animate-spin text-[#a855f7]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
          </svg>
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // Map day_number → post for fast calendar lookup
  const postsByDay = new Map<number, Post>();
  posts.forEach(p => postsByDay.set(p.day_number, p));

  const hasPosts = posts.length > 0;
  const hasBio = !!business.google_bio;

  const stats: { label: string; value: string; icon: React.ReactNode; comingSoon?: boolean }[] = [
    {
      label: 'Posts Generated',
      value: String(posts.length),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" fill="currentColor" />
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
          <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Google Bio',
      value: hasBio ? 'Ready' : 'Not yet',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
    <div className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in flex">
      {/* ===== Left sidebar ===== */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#27272a] bg-[#0a0a0a] sticky top-0 h-screen">
        <div className="p-5 border-b border-[#27272a]">
          <span className="inline-flex items-baseline gap-1.5 text-white font-bold text-lg tracking-tight">
            Captionly
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <SidebarItem
            label="Dashboard"
            active
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
            }
          />
          <SidebarItem
            label="Calendar"
            comingSoon
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
          />
          <SidebarItem
            label="Posts"
            comingSoon
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            }
          />
          <SidebarItem
            label="Business"
            onClick={() => navigate('/onboarding')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9v.01M9 13v.01M9 17v.01M15 9v.01M15 13v.01M15 17v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
          />
        </nav>

        <div className="p-3 border-t border-[#27272a] space-y-2">
          <div className="rounded-xl border border-[#7c3aed]/30 bg-gradient-to-br from-[#7c3aed]/10 to-[#a855f7]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#a855f7]">Pro tip</p>
            <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
              Regenerate anytime to get a fresh take in your tone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#0a0a0a] sticky top-0 z-10">
          <span className="inline-flex items-baseline gap-1.5 text-white font-bold tracking-tight">
            Captionly
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-zinc-400 hover:text-white"
          >
            Logout
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
          <main className="space-y-6">

              {/* TOP ROW — welcome + Generate buttons */}
              <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#a855f7]">Dashboard</p>
                  <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Welcome back, <span className="bg-gradient-to-r from-[#a855f7] to-[#c084fc] bg-clip-text text-transparent">{business.name}</span>
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Generate fresh content for your {business.type.toLowerCase()} in seconds.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                  {hasPosts && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a1a1a] border border-[#27272a] px-4 py-3 text-sm font-semibold text-zinc-200 hover:border-[#7c3aed]/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`}>
                        <path d="M4 4v6h6M20 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 10A8 8 0 0 0 6.34 6.34L4 9M4 14a8 8 0 0 0 13.66 3.66L20 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Regenerate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/30 hover:shadow-xl hover:shadow-[#7c3aed]/40 hover:from-[#6d28d9] hover:to-[#9333ea] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {generating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                        </svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" fill="currentColor" />
                        </svg>
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              </header>

              {generateError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 animate-fade-in">
                  {generateError}
                </div>
              )}

              {/* TWO-COLUMN LAYOUT — 70% left (ideas + calendar hero), 30% right (stats + bio + business) */}
              <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-6">

                {/* LEFT COLUMN */}
                <div className="space-y-5 min-w-0 animate-fade-up">

                  {/* Compact ideas card — no buttons inside, char counter inline with label */}
                  <section className="rounded-2xl border border-[#27272a] bg-[#111111] p-4 relative overflow-hidden">
                    <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#7c3aed] opacity-10 blur-3xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#a855f7] flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" fill="currentColor" />
                            </svg>
                          </span>
                          <label htmlFor="ideas" className="text-sm font-semibold text-white truncate">
                            What would you like to post about? (optional)
                          </label>
                        </div>
                        <span className="text-[11px] text-zinc-500 tabular-nums flex-shrink-0">
                          {ideas.length}/{IDEAS_MAX}
                        </span>
                      </div>
                      <textarea
                        id="ideas"
                        rows={2}
                        value={ideas}
                        onChange={e => setIdeas(e.target.value.slice(0, IDEAS_MAX))}
                        placeholder="e.g. We're running a summer sale this week, 20% off everything..."
                        maxLength={IDEAS_MAX}
                        className="w-full rounded-lg border border-[#27272a] bg-[#1a1a1a] px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent hover:border-zinc-700 transition-all resize-none"
                      />
                    </div>
                  </section>

                  {/* Content calendar — HERO of the page */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Content Calendar</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Your next 7 days of social posts</p>
                      </div>
                      <span className="hidden sm:inline-flex items-center rounded-full bg-[#7c3aed]/10 text-[#a855f7] px-3 py-1 text-xs font-medium border border-[#7c3aed]/30">
                        Week 1
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {DAYS.map(day => {
                        const post = postsByDay.get(day);
                        if (!post) {
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={handleGenerate}
                              disabled={generating}
                              className="group rounded-2xl border-2 border-dashed border-[#27272a] bg-[#0a0a0a] hover:bg-[#111111] hover:border-[#7c3aed]/60 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[260px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 group-hover:text-zinc-500">Day</span>
                              <span className="mt-1 text-5xl font-bold text-zinc-700 group-hover:text-zinc-500 tabular-nums leading-none">{day}</span>
                              <span className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] group-hover:bg-[#7c3aed]/20 text-zinc-500 group-hover:text-[#a855f7] transition-colors">
                                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </span>
                              <span className="mt-2 text-sm font-semibold text-zinc-400 group-hover:text-white">Generate this day</span>
                            </button>
                          );
                        }
                        const isCopied = copiedId === post.id;
                        const isExpanded = expandedIds.has(post.id);
                        const showToggle = post.content.length > 200;
                        return (
                          <article
                            key={post.id}
                            className="group rounded-2xl border border-[#27272a] bg-[#111111] hover:border-[#7c3aed]/40 p-5 transition-all flex flex-col min-h-[260px] animate-pop"
                          >
                            {/* Header — big day number + platform pill */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Day</p>
                                <p className="mt-0.5 text-4xl font-bold text-white tabular-nums leading-none">{post.day_number}</p>
                              </div>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLATFORM_BADGE[post.platform]}`}>
                                {post.platform}
                              </span>
                            </div>

                            {/* Content */}
                            <p className={`mt-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap flex-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
                              {post.content}
                            </p>

                            {/* Footer — expand toggle (left) + copy (right, always visible) */}
                            <div className="mt-4 flex items-center justify-between gap-3">
                              {showToggle ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(post.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#a855f7] hover:text-[#c084fc] transition-colors"
                                >
                                  {isExpanded ? 'Show less' : 'Show more'}
                                  <svg viewBox="0 0 24 24" fill="none" className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              ) : (
                                <span />
                              )}
                              <button
                                type="button"
                                onClick={() => handleCopy(post)}
                                aria-live="polite"
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                                  isCopied
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                    : 'border-[#27272a] bg-[#1a1a1a] text-zinc-300 hover:border-[#7c3aed]/50 hover:text-white hover:bg-[#7c3aed]/10'
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                                      <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

                {/* RIGHT COLUMN — stats stacked + bio + business info */}
                <aside className="space-y-4 min-w-0 animate-fade-up">
                  {/* Stats stacked vertically as compact horizontal cards */}
                  <div className="space-y-3">
                    {stats.map(stat => (
                      <div
                        key={stat.label}
                        className={`rounded-xl border border-[#27272a] bg-[#111111] p-4 transition-colors flex items-center gap-3 ${
                          stat.comingSoon ? 'opacity-60' : 'hover:border-[#7c3aed]/40'
                        }`}
                      >
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border flex-shrink-0 ${
                          stat.comingSoon
                            ? 'bg-zinc-900 border-[#27272a] text-zinc-600'
                            : 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#a855f7]'
                        }`}>
                          {stat.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xl font-bold leading-none ${stat.comingSoon ? 'text-zinc-500' : 'text-white'}`}>{stat.value}</p>
                          <p className="mt-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wide truncate">{stat.label}</p>
                        </div>
                        {stat.comingSoon && (
                          <span className="text-[10px] font-semibold text-[#a855f7] bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full px-1.5 py-0.5 flex-shrink-0">
                            Soon
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Google Business description (compact) */}
                  <section className="rounded-2xl border border-[#27272a] bg-[#111111] p-5 relative overflow-hidden">
                    <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-[#a855f7] opacity-10 blur-3xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#a855f7] flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                              <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </span>
                          <h2 className="text-sm font-semibold text-white truncate">Google Business description</h2>
                        </div>
                        {hasBio && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5 flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Ready
                          </span>
                        )}
                      </div>

                      {bioError && (
                        <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
                          {bioError}
                        </div>
                      )}

                      {hasBio ? (
                        <>
                          <div className="mt-3 rounded-lg border border-[#27272a] bg-[#1a1a1a] p-3 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                            {business.google_bio}
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] text-zinc-500 tabular-nums">{business.google_bio?.length ?? 0}/750</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleCopyBio}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-all ${
                                  bioCopied
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                    : 'border-[#27272a] bg-[#1a1a1a] text-zinc-300 hover:border-[#7c3aed]/50 hover:text-white'
                                }`}
                              >
                                {bioCopied ? 'Copied!' : 'Copy'}
                              </button>
                              <button
                                type="button"
                                onClick={handleGenerateBio}
                                disabled={generatingBio}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#1a1a1a] border border-[#27272a] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 hover:border-[#7c3aed]/50 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                              >
                                {generatingBio ? 'Regenerating…' : 'Regenerate'}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            A 400–700 char paragraph for your Google Business Profile.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateBio}
                            disabled={generatingBio}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#7c3aed]/30 hover:shadow-xl hover:shadow-[#7c3aed]/40 hover:from-[#6d28d9] hover:to-[#9333ea] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                          >
                            {generatingBio ? 'Generating…' : 'Generate bio'}
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Business info (compact) */}
                  <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-5 overflow-hidden relative">
                    <div aria-hidden className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#7c3aed] opacity-10 blur-2xl" />
                    <div className="relative">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a855f7]">Business Info</p>
                      <h3 className="mt-1.5 text-base font-bold text-white truncate">{business.name}</h3>
                      <p className="mt-0.5 text-[11px] text-zinc-500">{business.type}</p>

                      <dl className="mt-4 space-y-3 text-sm">
                        <SidebarRow
                          label="Location"
                          value={`${business.city}, ${business.country}`}
                          icon={
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          }
                        />
                        <SidebarRow
                          label="Tone"
                          value={business.tone}
                          icon={
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" fill="currentColor"/>
                            </svg>
                          }
                        />
                        <SidebarRow
                          label="Audience"
                          value={business.audience}
                          icon={
                            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                              <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2"/>
                              <path d="M2 20a7 7 0 0114 0M16 11a3 3 0 100-6M22 20a6 6 0 00-4-5.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          }
                        />
                      </dl>

                      <button
                        type="button"
                        onClick={() => navigate('/onboarding')}
                        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#27272a] bg-[#1a1a1a] px-3 py-2 text-[11px] font-semibold text-zinc-200 hover:border-[#7c3aed]/50 hover:text-white transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit business
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
          </main>
        </div>
      </div>

      {/* Scroll-for-more hint — fades on first scroll */}
      <div
        aria-hidden
        className={`pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-500 ${
          hasScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-[#111111]/85 backdrop-blur border border-[#27272a] px-3 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg shadow-black/30">
          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 animate-bounce text-[#a855f7]">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 cursor-not-allowed border border-transparent select-none"
      >
        <span className="text-zinc-700">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span className="text-[10px] font-semibold text-[#a855f7] bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full px-1.5 py-0.5">
          Soon
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[#7c3aed]/15 text-white border border-[#7c3aed]/30'
          : 'text-zinc-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent'
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
      <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#a855f7]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
        <dd className="text-sm font-medium text-zinc-200 break-words">{value}</dd>
      </div>
    </div>
  );
}
