import { Link } from 'react-router-dom';

/** Landing page — dark hero, features, testimonials, and footer */
export default function Landing() {
  /** Smoothly scrolls down to the features section */
  function scrollToFeatures() {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in">
      {/* ===== Top nav ===== */}
      <header className="absolute top-0 inset-x-0 z-20">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5">
          <Link to="/" className="flex items-center gap-2">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold rounded-lg bg-[#7c3aed] text-white px-4 py-2 shadow-lg shadow-[#7c3aed]/20 hover:bg-[#6d28d9] transition-colors"
            >
              Start creating
            </Link>
          </div>
        </nav>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative isolate overflow-hidden">
        {/* Purple glow behind headline */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[36rem] w-[36rem] rounded-full bg-[#7c3aed] opacity-30 blur-[120px] animate-glow" />
        </div>
        {/* Subtle grid lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-28 sm:pt-44 sm:pb-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] backdrop-blur border border-white/10 px-4 py-1.5 text-xs font-medium text-zinc-300 mb-7 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            New — Powered by Gemini
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white animate-fade-up">
            Make content that<br />gets results.
          </h1>
          <p className="mt-7 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed animate-fade-up">
            The AI content platform for local businesses. Turn your brand into scroll-stopping social posts.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#7c3aed] text-white px-7 py-3.5 text-sm font-semibold shadow-lg shadow-[#7c3aed]/40 hover:bg-[#6d28d9] hover:-translate-y-0.5 transition-all"
            >
              Start creating →
            </Link>
            <button
              type="button"
              onClick={scrollToFeatures}
              className="inline-flex items-center justify-center rounded-lg bg-white/[0.04] backdrop-blur border border-white/10 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/[0.08] hover:border-white/20 transition-colors"
            >
              See How It Works
            </button>
          </div>

          <p className="mt-7 text-xs text-zinc-500">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-[#27272a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[#a855f7] uppercase tracking-wide">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything you need, none of the writer's block
            </h2>
            <p className="mt-4 text-zinc-400">
              Tell us about your business once. We'll handle a month of content on every channel that matters.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="AI-Powered Content"
              description="Posts that actually sound like your brand — tuned to your tone, audience, and city."
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" fill="currentColor"/>
                  <path d="M19 14l.9 2.4L22 17l-2.1.6L19 20l-.9-2.4L16 17l2.1-.6L19 14z" fill="currentColor" opacity=".7"/>
                </svg>
              }
            />
            <FeatureCard
              title="Multi-Platform"
              description="Instagram captions and Facebook posts ready to copy, with hashtags and emojis baked in."
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
                </svg>
              }
            />
            <FeatureCard
              title="Ready in Seconds"
              description="No prompt engineering, no blank pages. A full month of content shows up before your coffee cools."
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor"/>
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-[#27272a] relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[40rem] rounded-full bg-[#7c3aed] opacity-10 blur-[120px]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[#a855f7] uppercase tracking-wide">Loved by local owners</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Less time on captions, more time with customers
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Testimonial
              quote="I run a salon in Austin and used to spend Sunday nights writing captions. Now I generate a month at a time, tweak a few, and I'm done. It actually sounds like us."
              name="Marisa Calderón"
              role="Owner, Bloom & Co. Salon"
              location="Austin, TX"
              initials="MC"
            />
            <Testimonial
              quote="We're a small gym and Instagram has always been an afterthought. Captionly gives us posts that fit our vibe — friendly, motivating, very Cleveland. Engagement is up almost double."
              name="Derek Patel"
              role="Co-founder, Lakefront Strength"
              location="Cleveland, OH"
              initials="DP"
            />
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-[#27272a]">
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#111111] border border-[#27272a] px-8 py-14 sm:px-14 sm:py-16 text-center relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#7c3aed] opacity-25 blur-[100px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#a855f7] opacity-15 blur-[100px]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Ready for a month of content?
            </h2>
            <p className="mt-4 text-zinc-400">Set up your business profile in under 60 seconds.</p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-[#7c3aed] text-white px-7 py-3.5 text-sm font-semibold shadow-lg shadow-[#7c3aed]/40 hover:bg-[#6d28d9] hover:-translate-y-0.5 transition-all"
              >
                Start creating →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-[#27272a] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-sm">
          <Wordmark />
          <p className="text-zinc-500">© {new Date().getFullYear()} Captionly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/** White wordmark with purple dot — used in nav and footer */
function Wordmark() {
  return (
    <span className="inline-flex items-baseline gap-1 text-white font-bold text-base tracking-tight">
      Captionly
      <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
    </span>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

/** A single feature card with a purple icon accent */
function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-[#27272a] bg-[#111111] p-7 hover:border-[#7c3aed]/50 hover:bg-[#1a1a1a] hover:-translate-y-0.5 transition-all">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#a855f7] mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  location: string;
  initials: string;
}

/** A single testimonial card on dark background */
function Testimonial({ quote, name, role, location, initials }: TestimonialProps) {
  return (
    <figure className="rounded-2xl border border-[#27272a] bg-[#111111] p-7 hover:border-[#7c3aed]/40 transition-colors">
      <div className="flex gap-1 text-[#a855f7]" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 1.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3.1L4.7 18l1.2-6L1.4 7.8l6-.7L10 1.5z" />
          </svg>
        ))}
      </div>
      <blockquote className="mt-4 text-zinc-200 leading-relaxed">
        "{quote}"
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-zinc-500">{role} · {location}</p>
        </div>
      </figcaption>
    </figure>
  );
}
