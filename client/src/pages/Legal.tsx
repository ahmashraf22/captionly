import { Link } from 'react-router-dom';

interface LegalProps {
  kind: 'terms' | 'privacy';
}

const LAST_UPDATED = 'May 2026';

/** Shared dark-themed legal page used for /terms and /privacy. */
export default function Legal({ kind }: LegalProps) {
  const isTerms = kind === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const intro = isTerms
    ? 'By using Captionly you agree to these terms. Please read them carefully.'
    : 'This policy explains what Captionly collects, how we use it, and the choices you have.';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-[#7c3aed] opacity-15 blur-[120px]" />

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
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>
        <p className="mt-6 text-zinc-300">{intro}</p>

        <article className="mt-10 space-y-8 text-zinc-300 leading-relaxed">
          {isTerms ? <TermsBody /> : <PrivacyBody />}
        </article>

        <p className="mt-12 text-xs text-zinc-500">
          Questions? Email{' '}
          <a href="mailto:support@captionly.app" className="text-[#a855f7] hover:text-[#c084fc]">
            support@captionly.app
          </a>
          .
        </p>

        <div className="mt-10 flex items-center gap-4 text-sm">
          <Link to={isTerms ? '/privacy' : '/terms'} className="text-[#a855f7] hover:text-[#c084fc]">
            {isTerms ? 'Read the Privacy Policy →' : 'Read the Terms of Service →'}
          </Link>
          <span className="text-zinc-700">·</span>
          <Link to="/signup" className="text-zinc-400 hover:text-white">
            Back to sign up
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
      <div className="mt-3 space-y-3 text-sm text-zinc-400">{children}</div>
    </section>
  );
}

/** Placeholder Terms of Service body — replace with reviewed legal copy before launch. */
function TermsBody() {
  return (
    <>
      <Section heading="1. Using Captionly">
        <p>
          Captionly generates social media content based on the business profile you provide. You're
          responsible for reviewing and approving all generated content before publishing it. You
          must be at least 18 years old, or the age of majority in your jurisdiction, to use the
          service.
        </p>
      </Section>
      <Section heading="2. Your account">
        <p>
          You're responsible for keeping your login credentials secure and for all activity under
          your account. Notify us at <a href="mailto:support@captionly.app" className="text-[#a855f7] hover:text-[#c084fc]">support@captionly.app</a> if you suspect unauthorized access.
        </p>
      </Section>
      <Section heading="3. Your content">
        <p>
          You retain ownership of the business information you submit and the AI-generated posts
          produced for you. You grant Captionly a limited license to process your inputs in order
          to generate, store, and display content within the product.
        </p>
      </Section>
      <Section heading="4. AI-generated output">
        <p>
          Captionly uses third-party AI models (currently Google Gemini) to generate content.
          Output may occasionally be inaccurate, off-brand, or otherwise unsuitable. Always review
          before posting publicly.
        </p>
      </Section>
      <Section heading="5. Acceptable use">
        <p>
          Don't use Captionly to generate content that is illegal, defamatory, misleading, or that
          infringes someone else's rights. We may suspend accounts that violate these rules.
        </p>
      </Section>
      <Section heading="6. Termination">
        <p>
          You can stop using Captionly at any time. We may suspend or terminate accounts that
          violate these terms or that pose a risk to the service or other users.
        </p>
      </Section>
      <Section heading="7. Disclaimers and liability">
        <p>
          Captionly is provided "as is" without warranties of any kind. To the fullest extent
          permitted by law, Captionly is not liable for indirect, incidental, or consequential
          damages arising from your use of the service.
        </p>
      </Section>
      <Section heading="8. Changes to these terms">
        <p>
          We may update these terms from time to time. Material changes will be communicated via
          the email on file. Continued use of the service after changes take effect means you
          accept the updated terms.
        </p>
      </Section>
    </>
  );
}

/** Placeholder Privacy Policy body — replace with reviewed legal copy before launch. */
function PrivacyBody() {
  return (
    <>
      <Section heading="1. What we collect">
        <p>
          When you sign up, we collect your email address. When you complete onboarding, we collect
          the business profile you submit (name, type, location, audience, tone, description). When
          you generate content, we send your business profile and any optional ideas you provide to
          our AI provider so it can produce posts.
        </p>
      </Section>
      <Section heading="2. How we use it">
        <p>
          We use the information you provide to: (a) authenticate you, (b) generate and store your
          posts, (c) operate and improve the service, and (d) communicate with you about your
          account.
        </p>
      </Section>
      <Section heading="3. Service providers">
        <p>
          We use Supabase to host our database and handle authentication, and Google Gemini to
          generate posts. These providers process data on our behalf under their own privacy
          commitments.
        </p>
      </Section>
      <Section heading="4. Data retention">
        <p>
          We keep your business profile and generated posts as long as your account is active. You
          can delete your account at any time by emailing <a href="mailto:support@captionly.app" className="text-[#a855f7] hover:text-[#c084fc]">support@captionly.app</a>.
        </p>
      </Section>
      <Section heading="5. Your choices">
        <p>
          You can review and edit your business profile from the dashboard. You can request a copy
          of your data, or its deletion, by contacting support.
        </p>
      </Section>
      <Section heading="6. Cookies and storage">
        <p>
          We use a small amount of browser storage to keep you signed in. We don't sell your data
          and we don't use third-party advertising trackers.
        </p>
      </Section>
      <Section heading="7. Children">
        <p>
          Captionly is not intended for children under 13. We do not knowingly collect data from
          children. If you believe a child has provided us data, contact support and we'll remove
          it.
        </p>
      </Section>
      <Section heading="8. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be communicated via
          the email on file.
        </p>
      </Section>
    </>
  );
}
