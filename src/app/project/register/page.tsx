'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRegisterProject } from '@/hooks/useProject';
import type { Chain } from '@/types';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(80),
  logo: z.string().url('Must be a valid URL').or(z.literal('')),
  website: z.string().url('Must be a valid URL'),
  twitter: z
    .string()
    .regex(/^@[\w]+$/, 'Must start with @ (e.g. @YourProject)')
    .or(z.literal('')),
  discord: z.string().min(2, 'Enter a Discord link'),
});

const step2Schema = z.object({
  chain: z.enum(['ETH', 'SOL', 'BNB', 'MATIC', 'ARB', 'BASE', 'AVAX'] as const),
  category: z.enum(['nft', 'memecoin', 'defi', 'gaming', 'other'] as const),
});

const step3Schema = z.object({
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
  confirmAccuracy: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm the accuracy' }),
  }),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAINS: { value: Chain; label: string; color: string; symbol: string }[] = [
  { value: 'ETH', label: 'Ethereum', color: '#627EEA', symbol: 'Ξ' },
  { value: 'SOL', label: 'Solana', color: '#9945FF', symbol: '◎' },
  { value: 'BNB', label: 'BNB Chain', color: '#F3BA2F', symbol: '⬡' },
  { value: 'MATIC', label: 'Polygon', color: '#8247E5', symbol: '⬟' },
  { value: 'ARB', label: 'Arbitrum', color: '#12AAFF', symbol: '▲' },
  { value: 'BASE', label: 'Base', color: '#0052FF', symbol: '⬡' },
  { value: 'AVAX', label: 'Avalanche', color: '#E84142', symbol: '▲' },
];

const CATEGORIES: { value: string; label: string; icon: string; desc: string }[] = [
  { value: 'nft', label: 'NFT Collection', icon: '🎨', desc: 'Art, collectibles & PFPs' },
  { value: 'memecoin', label: 'Memecoin', icon: '🐸', desc: 'Community-driven tokens' },
  { value: 'defi', label: 'DeFi Protocol', icon: '⚡', desc: 'Swaps, lending, yield' },
  { value: 'gaming', label: 'Gaming', icon: '🎮', desc: 'Web3 games & metaverse' },
  { value: 'other', label: 'Other', icon: '✦', desc: 'Anything else' },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Project Info', 'Chain & Category', 'Agreement'];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm transition-all duration-300',
                  isDone
                    ? 'bg-[#FF5C00] border-[#FF5C00] text-white'
                    : isActive
                    ? 'border-[#FF5C00] text-[#FF5C00] bg-[#FF5C00]/10'
                    : 'border-[#2A2A2A] text-[#444] bg-transparent',
                )}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive ? 'text-[#FF5C00]' : isDone ? 'text-[#777]' : 'text-[#444]',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-16 sm:w-24 mx-1 mb-5 transition-all duration-300',
                  step < current ? 'bg-[#FF5C00]' : 'bg-[#1E1E1E]',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest text-[#666]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#444]">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-[#2A2A2A] bg-[#111] px-3.5 py-3 text-sm text-white placeholder-[#444] focus:border-[#FF5C00]/60 focus:outline-none transition-colors',
        className,
      )}
      {...props}
    />
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiPiece({ i }: { i: number }) {
  const colors = ['#FF5C00', '#FFB347', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFF'];
  const color = colors[i % colors.length];
  const left = (i * 37 + 11) % 100;
  const delay = (i * 0.13) % 1.5;
  const size = 6 + (i % 4) * 3;
  const rotation = i * 47;
  return (
    <div
      className="absolute top-0 animate-bounce"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: i % 2 === 0 ? '50%' : '2px',
        transform: `rotate(${rotation}deg)`,
        animationDelay: `${delay}s`,
        animationDuration: `${1.2 + delay}s`,
      }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegisterProjectPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1 & Step2 & Step3>>({});
  const [success, setSuccess] = useState(false);
  const { mutate: register, isPending } = useRegisterProject();

  // Step 1 form
  const form1 = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: formData.name ?? '',
      logo: formData.logo ?? '',
      website: formData.website ?? '',
      twitter: formData.twitter ?? '',
      discord: formData.discord ?? '',
    },
  });

  // Step 2 form
  const form2 = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      chain: (formData.chain as Chain) ?? 'ETH',
      category: (formData.category as Step2['category']) ?? 'defi',
    },
  });

  // Step 3 form
  const form3 = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { agreeTerms: undefined, confirmAccuracy: undefined },
  });

  const logoPreview = form1.watch('logo');

  function handleStep1(data: Step1) {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  }

  function handleStep2(data: Step2) {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  }

  function handleStep3() {
    const merged = { ...formData } as Step1 & Step2;
    register(
      {
        name: merged.name,
        logo: merged.logo ?? '',
        website: merged.website,
        twitter: merged.twitter ?? '',
        discord: merged.discord,
        chain: merged.chain,
        category: merged.category,
      },
      { onSuccess: () => setSuccess(true) },
    );
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }, (_, i) => (
            <ConfettiPiece key={i} i={i} />
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-md w-full">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FF5C00]/20 text-5xl">
            🚀
          </div>
          <h1
            className="text-4xl font-black text-white mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            You're live!
          </h1>
          <p className="text-[#777] mb-8 text-base">
            <span className="text-white font-semibold">{formData.name}</span> has been
            registered on Dropforge. Your project dashboard is ready.
          </p>
          <div className="space-y-3">
            <Link
              href="/project/dashboard"
              className="block w-full rounded-xl bg-[#FF5C00] py-4 text-center text-base font-black text-white hover:bg-[#e05200] transition-colors"
            >
              Go to Dashboard →
            </Link>
            <Link
              href="/project/campaigns/create"
              className="block w-full rounded-xl border border-[#2A2A2A] py-4 text-center text-base font-semibold text-[#999] hover:text-white hover:border-[#444] transition-colors"
            >
              Create First Campaign
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #FF5C00 0%, transparent 70%)' }}
      />

      <div className="mx-auto max-w-xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#FF5C00]">
            <span className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              DROP<span className="text-white">FORGE</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-[#555]">Register your project</p>
        </div>

        <StepIndicator current={step} />

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(handleStep1)}>
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-7 space-y-5">
              <div>
                <h2
                  className="text-xl font-black text-white mb-1"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Project Information
                </h2>
                <p className="text-sm text-[#555]">Tell us about your project</p>
              </div>

              <Field label="Project Name *" error={form1.formState.errors.name?.message}>
                <Input
                  placeholder="e.g. Phantom Protocol"
                  {...form1.register('name')}
                />
              </Field>

              <Field
                label="Logo URL"
                error={form1.formState.errors.logo?.message}
                hint="Paste a direct link to your logo (PNG, SVG)"
              >
                <div className="flex gap-3">
                  <Input
                    placeholder="https://yourproject.xyz/logo.png"
                    {...form1.register('logo')}
                    className="flex-1"
                  />
                  {logoPreview && (
                    <div className="h-11 w-11 rounded-lg border border-[#2A2A2A] bg-[#111] overflow-hidden shrink-0">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Website URL *" error={form1.formState.errors.website?.message}>
                <Input
                  placeholder="https://yourproject.xyz"
                  type="url"
                  {...form1.register('website')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Twitter / X" error={form1.formState.errors.twitter?.message}>
                  <Input placeholder="@YourProject" {...form1.register('twitter')} />
                </Field>

                <Field label="Discord" error={form1.formState.errors.discord?.message}>
                  <Input placeholder="discord.gg/yourproject" {...form1.register('discord')} />
                </Field>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#FF5C00] py-3.5 text-sm font-black text-white hover:bg-[#e05200] transition-colors mt-2"
              >
                Continue →
              </button>
            </div>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(handleStep2)}>
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-7 space-y-6">
              <div>
                <h2
                  className="text-xl font-black text-white mb-1"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Chain & Category
                </h2>
                <p className="text-sm text-[#555]">Choose your blockchain and project type</p>
              </div>

              {/* Chain selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-3">
                  Primary Chain *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CHAINS.map((chain) => {
                    const selected = form2.watch('chain') === chain.value;
                    return (
                      <button
                        key={chain.value}
                        type="button"
                        onClick={() => form2.setValue('chain', chain.value)}
                        className={cn(
                          'relative flex flex-col items-center gap-2 rounded-xl border-2 py-4 px-3 transition-all duration-150',
                          selected
                            ? 'border-[#FF5C00] bg-[#FF5C00]/8'
                            : 'border-[#1E1E1E] bg-[#111] hover:border-[#2A2A2A]',
                        )}
                      >
                        <span
                          className="text-2xl font-black"
                          style={{ color: chain.color }}
                        >
                          {chain.symbol}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-bold',
                            selected ? 'text-white' : 'text-[#777]',
                          )}
                        >
                          {chain.value}
                        </span>
                        <span
                          className={cn(
                            'text-[10px]',
                            selected ? 'text-[#aaa]' : 'text-[#444]',
                          )}
                        >
                          {chain.label}
                        </span>
                        {selected && (
                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF5C00]" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {form2.formState.errors.chain && (
                  <p className="mt-1 text-xs text-red-400">
                    {form2.formState.errors.chain.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-3">
                  Project Category *
                </label>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const selected = form2.watch('category') === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() =>
                          form2.setValue('category', cat.value as Step2['category'])
                        }
                        className={cn(
                          'flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150',
                          selected
                            ? 'border-[#FF5C00] bg-[#FF5C00]/8'
                            : 'border-[#1E1E1E] bg-[#111] hover:border-[#2A2A2A]',
                        )}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-sm font-semibold',
                              selected ? 'text-white' : 'text-[#999]',
                            )}
                          >
                            {cat.label}
                          </p>
                          <p className="text-xs text-[#555]">{cat.desc}</p>
                        </div>
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full border-2 shrink-0',
                            selected
                              ? 'border-[#FF5C00] bg-[#FF5C00]'
                              : 'border-[#333]',
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-[#2A2A2A] px-5 py-3.5 text-sm font-semibold text-[#777] hover:text-white hover:border-[#444] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#FF5C00] py-3.5 text-sm font-black text-white hover:bg-[#e05200] transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={form3.handleSubmit(handleStep3)}>
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-7 space-y-6">
              <div>
                <h2
                  className="text-xl font-black text-white mb-1"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Review & Launch
                </h2>
                <p className="text-sm text-[#555]">Confirm your project details</p>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-[#242424] bg-[#111] divide-y divide-[#1A1A1A]">
                {[
                  { label: 'Project Name', value: formData.name },
                  { label: 'Website', value: formData.website },
                  { label: 'Twitter', value: formData.twitter || '—' },
                  { label: 'Discord', value: formData.discord },
                  { label: 'Chain', value: formData.chain },
                  {
                    label: 'Category',
                    value:
                      CATEGORIES.find((c) => c.value === formData.category)?.label ?? '—',
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-[#555] font-medium">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
                {formData.logo && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-[#555] font-medium">Logo</span>
                    <img
                      src={formData.logo}
                      alt="Logo"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
                    form3.watch('agreeTerms')
                      ? 'border-[#FF5C00]/40 bg-[#FF5C00]/5'
                      : 'border-[#1E1E1E] bg-[#111]',
                  )}
                >
                  <input
                    type="checkbox"
                    {...form3.register('agreeTerms')}
                    className="mt-0.5 rounded accent-[#FF5C00]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      I agree to Dropforge Terms of Service
                    </p>
                    <p className="text-xs text-[#555] mt-0.5">
                      By checking this you agree to our{' '}
                      <a href="#" className="text-[#FF5C00] underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-[#FF5C00] underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                </label>
                {form3.formState.errors.agreeTerms && (
                  <p className="text-xs text-red-400 px-1">
                    {form3.formState.errors.agreeTerms.message}
                  </p>
                )}

                <label
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
                    form3.watch('confirmAccuracy')
                      ? 'border-[#FF5C00]/40 bg-[#FF5C00]/5'
                      : 'border-[#1E1E1E] bg-[#111]',
                  )}
                >
                  <input
                    type="checkbox"
                    {...form3.register('confirmAccuracy')}
                    className="mt-0.5 rounded accent-[#FF5C00]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      I confirm this project information is accurate
                    </p>
                    <p className="text-xs text-[#555] mt-0.5">
                      False information may result in project removal.
                    </p>
                  </div>
                </label>
                {form3.formState.errors.confirmAccuracy && (
                  <p className="text-xs text-red-400 px-1">
                    {form3.formState.errors.confirmAccuracy.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-[#2A2A2A] px-5 py-3.5 text-sm font-semibold text-[#777] hover:text-white hover:border-[#444] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-[#FF5C00] py-3.5 text-sm font-black text-white hover:bg-[#e05200] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Launching...
                    </>
                  ) : (
                    '🚀 Launch My Project'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
