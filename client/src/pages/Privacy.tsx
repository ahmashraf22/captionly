import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = 'May 7, 2026';

/** Privacy Policy page — dark theme, matches the rest of the app */
export default function Privacy() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Effective date: {EFFECTIVE_DATE}</p>
        <p className="mt-6 text-zinc-300">
          This policy explains what information Captionly collects, how we use it, and the
          choices you have.
        </p>

        <article className="mt-10 space-y-8">
          <Section heading="1. Information We Collect">
            <p>
              When you sign up, we collect your <span className="text-zinc-200 font-medium">email
              address</span>. That's the only personal information required to create an account.
            </p>
            <p>
              When you complete onboarding, you also provide business information (name, type,
              city, country, target audience, tone, description). This is information about your
              business — not personal data about you — and it's used solely to generate content
              tailored to your brand.
            </p>
          </Section>

          <Section heading="2. How We Use It">
            <p>We use the information you provide to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Authenticate you and keep your account secure</li>
              <li>Generate, store, and display social media posts and Google Business descriptions</li>
              <li>Operate, maintain, and improve the Service</li>
              <li>Communicate with you about your account or important service updates</li>
            </ul>
            <p>
              We do not sell your data, and we do not use it for third-party advertising.
            </p>
          </Section>

          <Section heading="3. Supabase Data Storage">
            <p>
              Captionly uses{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a855f7] hover:text-[#c084fc]"
              >
                Supabase
              </a>{' '}
              to host our database and handle authentication. Your email, business profile, and
              generated posts are stored in Supabase's managed PostgreSQL database.
            </p>
            <p>
              Row Level Security (RLS) policies ensure that each user can only access their own
              data. Supabase processes this data on our behalf under their own security and
              privacy commitments.
            </p>
          </Section>

          <Section heading="4. Google OAuth Data">
            <p>
              If you choose to sign in with Google, we receive a limited set of profile
              information from Google — specifically your email address and a unique account
              identifier — used only to create and authenticate your Captionly account.
            </p>
            <p>
              We do not receive or store your Google password. We do not request access to your
              Gmail, Google Drive, contacts, or any other Google service. You can revoke
              Captionly's access at any time from your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a855f7] hover:text-[#c084fc]"
              >
                Google Account permissions page
              </a>
              .
            </p>
          </Section>

          <Section heading="5. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information by editing your business profile or contacting us</li>
              <li>Delete your account and associated data at any time</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Withdraw consent or object to certain types of processing</li>
            </ul>
            <p>
              To exercise any of these rights, email us at the address below. We'll respond
              within a reasonable timeframe.
            </p>
          </Section>

          <Section heading="6. Contact">
            <p>
              Questions about this policy, or about how your data is handled? Email us at{' '}
              <a
                href="mailto:support@captionly.app"
                className="text-[#a855f7] hover:text-[#c084fc]"
              >
                support@captionly.app
              </a>{' '}
              and we'll get back to you.
            </p>
          </Section>
        </article>

        <div className="mt-12 flex items-center gap-4 text-sm">
          <Link to="/" className="text-[#a855f7] hover:text-[#c084fc]">
            ← Back to home
          </Link>
          <span className="text-zinc-700">·</span>
          <Link to="/terms" className="text-zinc-400 hover:text-white">
            Terms of Service
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
