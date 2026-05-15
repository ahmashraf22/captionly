import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../lib/countries';

type BusinessType = 'Salon' | 'Gym' | 'Restaurant' | 'Dentist' | 'Cafe' | 'Retail Store' | 'Other';
type BrandTone = 'Friendly' | 'Professional' | 'Fun' | 'Inspirational';

interface FormData {
  name: string;
  type: BusinessType | '';
  city: string;
  country: string;
  audience: string;
  tone: BrandTone | '';
  description: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  city?: string;
  country?: string;
  audience?: string;
  tone?: string;
  description?: string;
}

const BUSINESS_TYPES: BusinessType[] = ['Salon', 'Gym', 'Restaurant', 'Dentist', 'Cafe', 'Retail Store', 'Other'];

// Aligned with the server-side PROMPT_FIELD_CAPS in server/src/routes/content.ts.
const NAME_MAX = 120;
const CITY_MAX = 100;
const AUDIENCE_MAX = 200;
const DESCRIPTION_MAX = 1000;

const TONE_OPTIONS: { value: BrandTone; emoji: string; description: string }[] = [
  { value: 'Friendly',      emoji: '😊', description: 'Warm, casual, like a neighborhood favorite' },
  { value: 'Professional',  emoji: '💼', description: 'Polished, trustworthy, expert tone' },
  { value: 'Fun',           emoji: '🎉', description: 'Playful, energetic, full of personality' },
  { value: 'Inspirational', emoji: '✨', description: 'Motivational, uplifting, aspirational' },
];

const STEPS = [
  { label: 'Business Profile', description: 'Tell us about you' },
  { label: 'Generate Content', description: 'AI does the work' },
  { label: 'Customize',        description: 'Polish & publish' },
];

/** Validates all form fields and returns an errors object */
function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = 'Business name is required.';
  if (!data.type) errors.type = 'Please select a business type.';
  if (!data.city.trim()) errors.city = 'City is required.';
  if (!data.country.trim()) errors.country = 'Country is required.';
  if (!data.audience.trim()) errors.audience = 'Target audience is required.';
  if (!data.tone) errors.tone = 'Please select a brand tone.';
  if (!data.description.trim()) errors.description = 'Business description is required.';
  return errors;
}

/** Step 1 of 3 onboarding — collects business profile and saves to Supabase (dark theme) */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState<FormData>({
    name: '',
    type: '',
    city: '',
    country: 'United States',
    audience: '',
    tone: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  /** Updates a single form field */
  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  /** Validates, then upserts the business row and navigates to /dashboard */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!user) {
      setServerError('You must be logged in to continue.');
      return;
    }

    setSubmitting(true);
    setServerError('');

    const { error } = await supabase.from('businesses').upsert(
      {
        user_id: user.id,
        name: form.name.trim(),
        type: form.type,
        city: form.city.trim(),
        country: form.country,
        audience: form.audience.trim(),
        tone: form.tone,
        description: form.description.trim(),
      },
      { onConflict: 'user_id' },
    );

    setSubmitting(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    navigate('/dashboard');
  }

  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-all ${
      errors[field]
        ? 'border-red-500/60 bg-red-500/5'
        : 'border-[#27272a] bg-[#1a1a1a] hover:border-zinc-700'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-start justify-center px-4 py-12 animate-fade-in relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-[#7c3aed] opacity-15 blur-[120px]" />

      <div className="relative w-full max-w-2xl animate-fade-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-baseline gap-1.5 text-white font-bold text-xl tracking-tight mb-4">
            Captionly
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
          </span>
          <h1 className="mt-3 text-3xl font-bold text-white tracking-tight">Set up your business</h1>
          <p className="mt-2 text-zinc-400 text-sm">Tell us about your business so we can generate content that fits.</p>
        </div>

        {/* Stepper */}
        <Stepper currentStep={0} />

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#111111] rounded-2xl border border-[#27272a] p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
        >
          {/* Business name */}
          <Field label="Business name" required error={errors.name}>
            <input
              type="text"
              placeholder="e.g. Glow Beauty Studio"
              value={form.name}
              maxLength={NAME_MAX}
              onChange={e => handleChange('name', e.target.value)}
              className={inputClass('name')}
            />
          </Field>

          {/* Business type */}
          <Field label="Business type" required error={errors.type}>
            <select
              value={form.type}
              onChange={e => handleChange('type', e.target.value as BusinessType)}
              className={inputClass('type')}
            >
              <option value="" className="bg-[#1a1a1a]">Select a type…</option>
              {BUSINESS_TYPES.map(t => (
                <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>
              ))}
            </select>
          </Field>

          {/* Country + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country" required error={errors.country}>
              <CountryCombobox
                value={form.country}
                onChange={v => handleChange('country', v)}
                hasError={!!errors.country}
              />
            </Field>
            <Field label="City" required error={errors.city}>
              <input
                type="text"
                placeholder="e.g. Austin"
                value={form.city}
                maxLength={CITY_MAX}
                onChange={e => handleChange('city', e.target.value)}
                className={inputClass('city')}
              />
            </Field>
          </div>

          {/* Target audience */}
          <Field label="Target audience" required error={errors.audience}>
            <input
              type="text"
              placeholder="e.g. young professionals aged 25–35"
              value={form.audience}
              maxLength={AUDIENCE_MAX}
              onChange={e => handleChange('audience', e.target.value)}
              className={inputClass('audience')}
            />
          </Field>

          {/* Brand tone */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-zinc-300">
                Brand tone <span className="text-red-400">*</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TONE_OPTIONS.map(opt => {
                const selected = form.tone === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`relative flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all select-none ${
                      selected
                        ? 'border-[#7c3aed] bg-[#7c3aed]/10 shadow-[0_0_0_1px_rgba(124,58,237,0.5)]'
                        : 'border-[#27272a] bg-[#1a1a1a] hover:border-zinc-700 hover:bg-[#1f1f1f]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={opt.value}
                      checked={selected}
                      onChange={() => handleChange('tone', opt.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${selected ? 'text-white' : 'text-zinc-200'}`}>{opt.value}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{opt.description}</p>
                    </div>
                    {selected && (
                      <span className="absolute top-3 right-3 text-[#a855f7]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path fillRule="evenodd" d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm-1.3-7.4l5.7-5.7-1.4-1.4-4.3 4.3-2.3-2.3-1.4 1.4 3.7 3.7z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {errors.tone && <p className="mt-2 text-xs text-red-400">{errors.tone}</p>}
          </div>

          {/* Business description */}
          <Field label="Business description" required error={errors.description}>
            <textarea
              rows={3}
              placeholder="Briefly describe what your business does and what makes it special…"
              value={form.description}
              maxLength={DESCRIPTION_MAX}
              onChange={e => handleChange('description', e.target.value)}
              className={inputClass('description')}
            />
            <p className="mt-1 text-xs text-zinc-500 text-right tabular-nums">
              {form.description.length}/{DESCRIPTION_MAX}
            </p>
          </Field>

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
            {submitting ? 'Saving…' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

/** Wraps an input with a label + error message in the dark onboarding style */
function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/** Renders a horizontal step indicator with circles + connecting bars */
function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <li key={step.label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center text-center min-w-0">
                <div
                  className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white shadow-lg shadow-[#7c3aed]/40'
                      : isComplete
                      ? 'bg-[#7c3aed]/20 text-[#a855f7] border border-[#7c3aed]/40'
                      : 'bg-[#1a1a1a] text-zinc-500 border border-[#27272a]'
                  }`}
                >
                  {isComplete ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <p className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-white' : 'text-zinc-500'} truncate`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-zinc-600 hidden sm:block truncate">{step.description}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 sm:mx-3 mt-[-22px] rounded-full ${isComplete ? 'bg-[#7c3aed]' : 'bg-[#27272a]'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
}

/** Searchable country selector with keyboard navigation (dark theme) */
function CountryCombobox({ value, onChange, hasError }: CountryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    /** Closes the popover when the user clicks outside the combobox */
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Scrolls the active option into view when navigating with arrow keys */
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function selectCountry(country: string) {
    onChange(country);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        selectCountry(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const inputClass = `w-full rounded-lg border px-4 py-2.5 pr-9 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent transition-all ${
    hasError
      ? 'border-red-500/60 bg-red-500/5'
      : 'border-[#27272a] bg-[#1a1a1a] hover:border-zinc-700'
  }`;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="country-listbox"
        placeholder="Search a country…"
        value={open ? query : value}
        onFocus={() => { setQuery(''); setOpen(true); setActiveIndex(0); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIndex(0); }}
        onKeyDown={handleKeyDown}
        className={inputClass}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {open && (
        <ul
          ref={listRef}
          id="country-listbox"
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#27272a] bg-[#111111] shadow-2xl shadow-black/60"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-zinc-500">No matches</li>
          ) : (
            filtered.map((country, idx) => {
              const isActive = idx === activeIndex;
              const isSelected = country === value;
              return (
                <li
                  key={country}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={e => { e.preventDefault(); selectCountry(country); }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer ${
                    isActive ? 'bg-[#7c3aed]/15 text-white' : 'text-zinc-300'
                  }`}
                >
                  <span>{country}</span>
                  {isSelected && (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#a855f7]">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
