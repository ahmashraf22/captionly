import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = 'May 7, 2026';

/** Terms of Service page — dark theme, matches the rest of the app */
export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-[#7c3aed] opacity-15 blur-[120px]"
      />

      <header className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link
          to="/"
          className="inline-flex items-baseline gap-1.5 text-white font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          Captionly
          <span className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
        </Link>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-sm font-medium text-[#a855f7] uppercase tracking-wide">Legal</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>
        <p className="mt-6 text-zinc-300">
          By using Captionly, you agree to these terms. Please read them carefully.
        </p>

        <article className="mt-10 space-y-8">
          <Section heading="1. Acceptance">
            <p>
              By accessing or using Captionly (the "Service"), you agree to be bound by these
              Terms of Service. If you do not agree, do not use the Service. You must be at least
              18 years old, or the age of majority in your jurisdiction, to create an account.
            </p>
          </Section>

          <Section heading="2. Use of Service">
            <p>
              Captionly generates social media content, Google Business profile descriptions, and
              related marketing copy based on the business information you provide. You agree to
              use the Service only for lawful purposes and in compliance with all applicable laws.
            </p>
            <p>
              You may not use the Service to generate content that is illegal, defamatory,
              misleading, infringing, harassing, or that violates the rights of others. We may
              suspend or terminate accounts that violate these rules.
            </p>
          </Section>

          <Section heading="3. AI-Generated Content Disclaimer">
            <p>
              Captionly uses third-party AI models (currently Google Gemini) to generate content.
              AI output may occasionally be inaccurate, off-brand, biased, or otherwise unsuitable
              for publication. <span className="text-zinc-200 font-medium">You are solely
              responsible for reviewing, editing, and approving all generated content before
              publishing it.</span>
            </p>
            <p>
              Captionly makes no warranty that generated content will be original, fit for a
              particular purpose, or free of errors. You should not rely on AI output as
              professional, legal, medical, or financial advice.
            </p>
          </Section>

          <Section heading="4. User Accounts">
            <p>
              You are responsible for keeping your login credentials secure and for all activity
              that occurs under your account. You agree to provide accurate information during
              signup and onboarding, and to keep that information up to date.
            </p>
            <p>
              Notify us immediately at{' '}
              <a
                href="mailto:support@captionly.app"
                className="text-[#a855f7] hover:text-[#c084fc]"
              >
                support@captionly.app
              </a>{' '}
              if you suspect any unauthorized access to your account.
            </p>
          </Section>

          <Section heading="5. Termination">
            <p>
              You may stop using Captionly and delete your account at any time. We may suspend or
              terminate your access to the Service at our discretion, without notice, if we
              believe you have violated these terms or pose a risk to the Service or other users.
            </p>
            <p>
              Upon termination, your right to use the Service ends immediately. Provisions of
              these terms that by their nature should survive termination will survive (including
              disclaimers and limitations of liability).
            </p>
          </Section>

          <Section heading="6. Limitation of Liability">
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind,
              whether express or implied. To the fullest extent permitted by law, Captionly and
              its operators shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including lost profits, lost data, or business
              interruption, arising out of or in connection with your use of the Service.
            </p>
            <p>
              Our total liability for any claim arising out of or relating to the Service is
              limited to the amount you paid us in the twelve months preceding the claim, or USD
              $50, whichever is greater.
            </p>
          </Section>
        </article>

        <p className="mt-12 text-xs text-zinc-500">
          Questions? Email{' '}
          <a href="mailto:support@captionly.app" className="text-[#a855f7] hover:text-[#c084fc]">
            support@captionly.app
          </a>
          .
        </p>

        <div className="mt-10 flex items-center gap-4 text-sm">
          <Link to="/" className="text-[#a855f7] hover:text-[#c084fc]">
            ← Back to home
          </Link>
          <span className="text-zinc-700">·</span>
          <Link to="/privacy" className="text-zinc-400 hover:text-white">
            Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}

interface SectionProps {
  heading: string;
  children: React.ReactNode;
}

/** A single titled section in the legal body */
function Section({ heading, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  );
}
