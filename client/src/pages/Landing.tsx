import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

/** Landing page — editorial dark theme with magazine typography, asymmetric hero, and live product preview */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /** Smoothly scrolls to The System section */
  function scrollToSystem() {
    document.getElementById('system')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-x-clip selection:bg-[#a855f7]/40">
      {/* Editorial film grain — hidden on mobile and under reduced-motion via CSS */}
      <div aria-hidden className="film-grain" />

      {/* ===== Nav ===== */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[1400px] mx-auto flex items-center justify-between px-6 sm:px-10 py-5">
          <Link to="/" className="flex items-center group">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-2 text-sm font-semibold text-[#0a0a0a] bg-white px-5 py-2.5 rounded-full hover:bg-[#a855f7] hover:text-white transition-all duration-500"
            >
              Start free
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
            </Link>
          </div>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative pt-36 sm:pt-44 pb-20 sm:pb-32">
        {/* Ambient color */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#7c3aed] opacity-25 blur-[140px] animate-glow" />
          <div className="absolute top-[30%] left-[-15%] h-[28rem] w-[28rem] rounded-full bg-[#a855f7] opacity-[0.12] blur-[140px]" />
        </div>
        {/* Topo grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '96px 96px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 30% 35%, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 60% at 30% 35%, black 30%, transparent 75%)',
          }}
        />

        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-12 gap-x-8 items-start">
            {/* Headline column */}
            <div className="lg:col-span-7 relative z-10">
              <div className="flex items-center gap-3 mb-8 sm:mb-10 animate-fade-up">
                <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                  Vol.01 — The Local Issue
                </span>
                <span className="h-px flex-1 bg-zinc-800 max-w-[100px]" />
                <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-[#a855f7]">
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-[#a855f7] animate-ping opacity-75" />
                    <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
                  </span>
                  Live
                </span>
              </div>

              <h1
                className="font-display text-white tracking-[-0.02em] leading-[0.9]"
                style={{ fontSize: 'clamp(3.4rem, 9vw, 8.25rem)' }}
              >
                <span
                  className="block animate-fade-up"
                  style={{ animationDelay: '120ms' }}
                >
                  Captions that
                </span>
                <span
                  className="block italic text-[#a855f7] animate-fade-up"
                  style={{ animationDelay: '240ms' }}
                >
                  don't sound
                </span>
                <span
                  className="block animate-fade-up"
                  style={{ animationDelay: '360ms' }}
                >
                  like a robot.
                </span>
              </h1>

              <p
                className="mt-9 sm:mt-10 max-w-xl text-lg sm:text-xl text-zinc-400 leading-[1.55] animate-fade-up"
                style={{ animationDelay: '480ms' }}
              >
                Captionly is the AI content studio for{' '}
                <span className="text-white">salons, gyms, restaurants, and dentists</span> who'd
                rather see customers than stare at a blank caption box. A month of social posts,
                Google bios, and email — written in your voice, ready in seconds.
              </p>

              <div
                className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up"
                style={{ animationDelay: '600ms' }}
              >
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center gap-3 text-base font-semibold text-[#0a0a0a] bg-white pl-6 pr-7 py-4 rounded-full hover:bg-[#a855f7] hover:text-white transition-all duration-500"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-[#7c3aed] group-hover:bg-white transition-colors" />
                  Create my first month
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
                  onClick={scrollToSystem}
                  className="group inline-flex items-center gap-3 text-base font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 group-hover:border-white/40 group-hover:bg-white/[0.04] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1v12m0 0l5-5m-5 5l-5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  How it works
                </button>
              </div>

              <div
                className="mt-10 sm:mt-12 flex items-center gap-5 flex-wrap animate-fade-up"
                style={{ animationDelay: '720ms' }}
              >
                <div className="flex items-center -space-x-2.5">
                  {['#7c3aed', '#f59e0b', '#22d3ee', '#ec4899', '#10b981'].map((c, i) => (
                    <span
                      key={i}
                      className="inline-block h-8 w-8 rounded-full border-2 border-[#0a0a0a] shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${c}, #ffffff20)` }}
                    />
                  ))}
                </div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
                  <span className="text-white">1,400+</span> local owners — Austin to Anchorage
                </p>
              </div>
            </div>

            {/* Floating post mock */}
            <div className="lg:col-span-5 mt-20 lg:mt-0 relative">
              <div
                className="relative lg:absolute lg:right-0 lg:-top-4 lg:w-[26rem] xl:w-[28rem] mx-auto max-w-md animate-fade-up"
                style={{ animationDelay: '420ms' }}
              >
                {/* Decorative offset card */}
                <div className="hidden lg:block absolute -inset-5 rounded-[2rem] border border-white/[0.06] rotate-[6deg]" />
                <div className="hidden lg:block absolute -inset-10 rounded-[2rem] border border-white/[0.03] rotate-[10deg]" />

                <div className="animate-float">
                  <PostMock />
                </div>

                {/* Floating data chip — bottom-left */}
                <div
                  className="absolute -left-3 -bottom-4 lg:-left-10 z-20 px-3.5 py-2 rounded-full bg-[#0f0f10]/95 border border-white/10 backdrop-blur shadow-2xl shadow-black/50 -rotate-3 animate-fade-up"
                  style={{ animationDelay: '780ms' }}
                >
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-300">
                    <span className="text-[#a855f7]">+</span> 14 hashtags suggested
                  </p>
                </div>

                {/* Floating data chip — top-right */}
                <div
                  className="absolute -right-2 top-8 lg:-right-8 z-20 px-3.5 py-2 rounded-full bg-[#0f0f10]/95 border border-white/10 backdrop-blur shadow-2xl shadow-black/50 rotate-[6deg] animate-fade-up"
                  style={{ animationDelay: '900ms' }}
                >
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-300">
                    Tone <span className="text-white">· friendly</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-zinc-500 animate-fade-up"
          style={{ animationDelay: '1100ms' }}
        >
          <span className="font-mono text-[9px] tracking-[0.36em] uppercase">Scroll</span>
          <span className="h-10 w-px bg-gradient-to-b from-zinc-500 to-transparent animate-pulse-soft" />
        </div>
      </section>

      {/* ===== Marquee ===== */}
      <section className="relative border-y border-white/[0.07] py-7 bg-[#0c0c0d]/70 overflow-hidden">
        <div className="flex items-center whitespace-nowrap font-display text-3xl sm:text-4xl lg:text-5xl text-zinc-600 italic animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {[
                'Austin, TX',
                'Brooklyn, NY',
                'Miami, FL',
                'Portland, OR',
                'Denver, CO',
                'Nashville, TN',
                'Chicago, IL',
                'Phoenix, AZ',
                'Cleveland, OH',
                'Charleston, SC',
                'Boise, ID',
                'Asheville, NC',
              ].map((city, i) => (
                <span key={`${dup}-${i}`} className="flex items-center">
                  <span className="px-8">{city}</span>
                  <span className="text-[#7c3aed] not-italic text-xl">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ===== The System (features) ===== */}
      <section id="system" className="relative py-24 sm:py-36 px-6 sm:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 mb-16 sm:mb-20" data-reveal>
            <div className="lg:col-span-4">
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                § 01 — The System
              </p>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.015em]">
                One brief.
                <br />
                <span className="italic text-zinc-500">Thirty days</span> of content.
              </h2>
              <p className="mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed">
                You answer a few questions about your business once. Captionly turns it into a
                month of posts that sound nothing like a chatbot — and everything like you on a
                good day.
              </p>
            </div>
          </div>

          <div className="border-y border-white/[0.07] divide-y divide-white/[0.07]">
            <FeatureRow
              number="01"
              eyebrow="Brief"
              title={
                <>
                  Tell us about <span className="italic">your block</span>.
                </>
              }
              body="Name, neighborhood, who walks in the door, the tone you use with regulars. Sixty seconds, one form. We keep it on file so you never write it twice."
            />
            <FeatureRow
              number="02"
              eyebrow="Draft"
              title={
                <>
                  Gemini writes. <span className="italic">In your voice.</span>
                </>
              }
              body="Thirty caption-ready posts for Instagram and Facebook, plus a Google Business description and email drafts. Each one tuned to your tone, audience, and city — never the same line twice."
            />
            <FeatureRow
              number="03"
              eyebrow="Ship"
              title={
                <>
                  Copy. Paste. <span className="italic">Go grow.</span>
                </>
              }
              body="One click to copy a caption. Tweak the parts you want, post the rest. Regenerate any day in seconds. The blank page is officially someone else's problem."
            />
          </div>
        </div>
      </section>

      {/* ===== Field Notes (testimonials) ===== */}
      <section className="relative py-24 sm:py-36 px-6 sm:px-10 border-t border-white/[0.07] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[40rem] rounded-full bg-[#7c3aed] opacity-[0.10] blur-[140px]"
        />
        <div className="relative max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 mb-14 sm:mb-20" data-reveal>
            <div className="lg:col-span-4">
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500">
                § 02 — Field Notes
              </p>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.015em]">
                Heard around <span className="italic text-[#a855f7]">Main Street</span>.
              </h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20">
            <PullQuote
              quote={
                <>
                  I used to spend Sunday nights writing captions. Now a month shows up before my{' '}
                  <span className="italic">coffee cools</span>. And it actually sounds like our
                  salon.
                </>
              }
              name="Marisa Calderón"
              role="Owner, Bloom &amp; Co. Salon"
              location="Austin, TX"
              swatch="from-[#7c3aed] to-[#a855f7]"
            />
            <PullQuote
              quote={
                <>
                  Instagram used to be an afterthought. Captionly gives us posts that fit our vibe —{' '}
                  <span className="italic">friendly, motivating, very Cleveland</span>.
                  Engagement nearly doubled.
                </>
              }
              name="Derek Patel"
              role="Co-founder, Lakefront Strength"
              location="Cleveland, OH"
              swatch="from-[#a855f7] to-[#22d3ee]"
            />
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative py-28 sm:py-40 px-6 sm:px-10 border-t border-white/[0.07] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[42rem] w-[42rem] rounded-full bg-[#7c3aed] opacity-[0.18] blur-[160px]" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '120px 120px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />

        <div className="relative max-w-[1400px] mx-auto text-center" data-reveal>
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-[#a855f7] mb-6">
            § 03 — The Invitation
          </p>
          <h2
            className="font-display tracking-[-0.02em] leading-[0.9]"
            style={{ fontSize: 'clamp(3rem, 11vw, 10rem)' }}
          >
            <span className="block">Make content</span>
            <span className="block italic text-zinc-300">that gets</span>
            <span className="relative inline-block">
              results.
              <span className="absolute -bottom-1 left-2 right-2 h-[3px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent" />
            </span>
          </h2>

          <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-3 text-base font-semibold text-[#0a0a0a] bg-white pl-6 pr-8 py-4 rounded-full hover:bg-[#a855f7] hover:text-white transition-all duration-500"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[#7c3aed] group-hover:bg-white transition-colors" />
              Start writing — free
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
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-500">
              No card · 60-second setup · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/[0.07] bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <Wordmark />
              </Link>
              <span className="hidden sm:block h-px w-8 bg-zinc-700" />
              <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
                Made for local · Built in 2026
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/terms"
                className="font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="font-mono text-[10px] tracking-[0.22em] uppercase text-zinc-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase">
                © {new Date().getFullYear()} Captionly
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Editorial wordmark — serif Captionly with a glowing purple dot */
function Wordmark() {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-white font-display text-2xl sm:text-[1.6rem] leading-none tracking-[-0.01em]">
      Captionly
      <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_12px_rgba(124,58,237,0.9)]" />
    </span>
  );
}

/** A faux Instagram post card showing a Captionly-generated caption — used as the hero showpiece */
function PostMock() {
  return (
    <div className="relative rounded-[1.5rem] bg-[#101012] border border-white/[0.08] overflow-hidden shadow-[0_40px_100px_-20px_rgba(124,58,237,0.4)] rotate-[3deg] transition-transform duration-700 hover:rotate-[0.5deg] hover:scale-[1.01]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white">
          BC
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
            bloomandco.salon
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#a855f7">
              <path d="M6 1l1.5 1.5L9.5 2l.5 2 2 .5L11.5 6.5 12 8.5l-2 .5-.5 2-2-.5L6 12l-1.5-1.5L2.5 11 2 9 0 8.5 0.5 6.5 0 4.5l2-.5L2.5 2l2 .5L6 1z" opacity=".4"/>
              <path d="M4.5 6.5l1 1 2-2.5" stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </p>
          <p className="text-[10px] text-zinc-500 truncate">Austin, TX</p>
        </div>
        <button type="button" className="text-zinc-400 px-1" aria-label="More">
          <svg width="20" height="4" viewBox="0 0 20 4" fill="currentColor">
            <circle cx="2" cy="2" r="2" />
            <circle cx="10" cy="2" r="2" />
            <circle cx="18" cy="2" r="2" />
          </svg>
        </button>
      </div>

      {/* "Image" area */}
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1226] via-[#7c3aed]/40 to-[#f0abfc]/30" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.22), transparent 42%), radial-gradient(circle at 78% 72%, rgba(168,85,247,0.55), transparent 50%), radial-gradient(circle at 52% 50%, rgba(255,210,180,0.18), transparent 55%)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <p className="font-display italic text-white/95 text-center leading-[1.02] drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
             style={{ fontSize: 'clamp(2rem, 5.2vw, 3.6rem)' }}>
            Soft hair,
            <br />
            strong week.
          </p>
        </div>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur text-[10px] font-mono tracking-[0.18em] uppercase text-white/90">
          Day 12 / 30
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-white/[0.06]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-zinc-200" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-zinc-200" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 01-9 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.2A8.5 8.5 0 1121 11.5z" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-zinc-200" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        <div className="flex-1" />
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-zinc-200" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
        </svg>
      </div>

      {/* Caption */}
      <div className="px-5 pb-5">
        <p className="text-sm text-zinc-200 leading-relaxed">
          <span className="font-semibold text-white">bloomandco.salon</span> New week, fresh ends.
          Walk-ins welcome on Tuesday — first ten get a free deep-condition on us. ✨
        </p>
        <p className="mt-2 text-sm text-[#a855f7]">
          #AustinSalon #SouthCongress #HairGoals
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
            Generated · 0.8s
          </p>
          <button
            type="button"
            className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-300 hover:bg-white/[0.08] transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

interface FeatureRowProps {
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
}

/** A single numbered feature row laid out as a magazine spread */
function FeatureRow({ number, eyebrow, title, body }: FeatureRowProps) {
  return (
    <div className="grid lg:grid-cols-12 gap-x-8 gap-y-4 py-10 sm:py-14 group" data-reveal>
      <div className="lg:col-span-2 flex items-start">
        <span className="font-display text-[5rem] sm:text-[6rem] lg:text-[7rem] text-zinc-700 group-hover:text-[#a855f7] transition-colors duration-700 leading-[0.85]">
          {number}
        </span>
      </div>
      <div className="lg:col-span-3 flex items-start">
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-zinc-500 mt-2 lg:mt-6">
          — {eyebrow}
        </p>
      </div>
      <div className="lg:col-span-7">
        <h3 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05] tracking-[-0.01em] text-white">
          {title}
        </h3>
        <p className="mt-5 text-base sm:text-lg text-zinc-400 leading-[1.6] max-w-xl">{body}</p>
      </div>
    </div>
  );
}

interface PullQuoteProps {
  quote: React.ReactNode;
  name: string;
  role: string;
  location: string;
  swatch: string;
}

/** A magazine-style pull quote with a thin top rule and oversized opening mark */
function PullQuote({ quote, name, role, location, swatch }: PullQuoteProps) {
  return (
    <figure className="relative pt-10 group" data-reveal>
      <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-white/40 via-white/10 to-transparent" />
      <span
        aria-hidden
        className="font-display italic text-[6rem] leading-[0.6] text-[#a855f7]/40 absolute top-2 -left-1 select-none"
      >
        &ldquo;
      </span>
      <blockquote className="relative pl-2 font-display text-[1.8rem] sm:text-[2.1rem] lg:text-[2.4rem] leading-[1.18] tracking-[-0.005em] text-white">
        {quote}
      </blockquote>
      <figcaption className="mt-8 flex items-center gap-4">
        <span className={`h-10 w-10 rounded-full bg-gradient-to-br ${swatch} shadow-lg`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-500 mt-0.5">
            {role} · {location}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
