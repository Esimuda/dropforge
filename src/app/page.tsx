'use client';

import React, { useState } from 'react';
import {
  Plus,
  Zap,
  Trophy,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Twitter,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import CampaignCard from '@/components/common/CampaignCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import LoginModal from '@/components/common/LoginModal';
import { useCampaigns } from '@/hooks/useCampaigns';

const CHAINS = [
  { name: 'Ethereum', color: '#627EEA' },
  { name: 'Base', color: '#0052FF' },
  { name: 'Arbitrum', color: '#28A0F0' },
  { name: 'Polygon', color: '#8247E5' },
  { name: 'BNB', color: '#F3BA2F' },
  { name: 'Solana', color: '#9945FF' },
  { name: 'Avalanche', color: '#E84142' },
];

const PARTICIPANT_STEPS = [
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Sign in',
    body: 'Connect X, Discord, or your wallet. No password, no spam.',
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: 'Complete tasks',
    body: 'Follow, retweet, join servers, hold tokens — earn points for each.',
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Climb the board',
    body: 'Stack points across campaigns. The top of every leaderboard wins more.',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Claim rewards',
    body: 'Submit your wallet, claim airdrops or whitelist spots when it ends.',
  },
];

const PROJECT_FEATURES = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Bot-resistant tasks',
    body: 'Auto-verified social actions and manual review keep Sybils out.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Launch in minutes',
    body: 'No code, no contracts. Pick a chain, set tasks, publish.',
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Real participants',
    body: 'Tap into a community of onchain users already hunting drops.',
  },
];

const FAQS = [
  {
    q: 'Is Dropforge free to use?',
    a: 'Joining campaigns is always free for participants. Projects pay only when they launch a campaign with paid rewards.',
  },
  {
    q: 'Which chains are supported?',
    a: 'Ethereum, Base, Arbitrum, Polygon, BNB Chain, Solana, and Avalanche — with more rolling out monthly.',
  },
  {
    q: 'How do you stop bots and Sybils?',
    a: 'Tasks combine auto-verification (Twitter, Discord, onchain) with optional manual review and per-wallet caps. Suspicious entries are flagged before rewards are distributed.',
  },
  {
    q: 'When do I get my airdrop?',
    a: 'Each campaign sets its own claim window. Once the campaign ends and you submit your wallet, the project sends rewards directly onchain.',
  },
];

const STATS = [
  { label: 'Active campaigns', value: '128' },
  { label: 'Quests completed', value: '2.4M+' },
  { label: 'Wallets onboarded', value: '310K' },
  { label: 'Chains supported', value: '7' },
];

export default function HomePage() {
  const { data: campaigns, isLoading } = useCampaigns({ status: 'active' });
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b border-[#141414]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#FF5C00]/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-72 h-72 bg-[#FF5C00]/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#222] bg-[#141414] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#AAA]">
              Now live · 128 active campaigns
            </span>
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Complete quests.
            <br />
            Earn rewards.
            <br />
            <span className="bg-gradient-to-r from-[#FF5C00] to-[#FF8C00] bg-clip-text text-transparent">
              Claim airdrops.
            </span>
          </h1>

          <p className="text-[#999] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Dropforge is the crypto-native quest platform where projects launch
            campaigns and real users earn allowlists, NFTs and tokens.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <a
              href="/campaigns"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white font-semibold transition-colors shadow-lg shadow-[#FF5C00]/30"
            >
              Browse campaigns
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/campaigns/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-[#2A2A2A] bg-[#141414] hover:border-[#FF5C00]/50 hover:bg-[#1A1A1A] text-white font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create a campaign
            </a>
            <button
              onClick={() => setLoginOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-[#AAA] hover:text-white text-sm font-medium transition-colors"
            >
              or sign in to start earning →
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {CHAINS.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414] border border-[#222] text-[11px] font-mono text-[#AAA]"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Stats ─── */}
      <section className="border-b border-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#1A1A1A]">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#0A0A0A] p-6 text-center">
              <p
                className="text-3xl sm:text-4xl font-black text-[#FF5C00] tabular-nums"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {s.value}
              </p>
              <p className="text-[11px] uppercase tracking-widest text-[#666] mt-1.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured Campaigns ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-2">
              Featured
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Live campaigns
            </h2>
          </div>
          <a
            href="/campaigns"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-[#FF5C00] hover:text-[#FF8040] font-medium"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          {!isLoading &&
            campaigns &&
            campaigns.length > 0 &&
            campaigns.slice(0, 6).map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          {!isLoading && (!campaigns || campaigns.length === 0) && (
            <div className="col-span-full">
              <EmptyState message="No active campaigns right now. Check back soon — or launch your own." />
            </div>
          )}
        </div>
      </section>

      {/* ─── For Participants ─── */}
      <section className="border-y border-[#141414] bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-3">
                For participants
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Turn engagement into onchain rewards.
              </h2>
              <p className="text-[#888] text-base leading-relaxed mb-6">
                You're early to the next big project anyway. Dropforge makes sure
                you get paid for showing up — in tokens, NFTs, and allowlist spots.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-sm font-semibold"
                >
                  Sign in to start
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="/campaigns"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#2A2A2A] bg-[#141414] hover:border-[#FF5C00]/40 text-white text-sm font-semibold"
                >
                  Browse campaigns
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PARTICIPANT_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-[#1E1E1E] bg-[#141414] p-5 hover:border-[#FF5C00]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center">
                      {step.icon}
                    </span>
                    <span className="text-xs font-mono text-[#444]">
                      0{i + 1}
                    </span>
                  </div>
                  <h3
                    className="text-base font-bold text-white mb-1"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#888] leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── For Projects ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="order-2 lg:order-1 grid grid-cols-1 gap-4">
            {PROJECT_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#1E1E1E] bg-[#141414] p-5 flex items-start gap-4 hover:border-[#FF5C00]/30 transition-colors"
              >
                <span className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </span>
                <div>
                  <h3
                    className="text-base font-bold text-white mb-1"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#888] leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-3">
              For projects
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Distribute to people who actually care.
            </h2>
            <p className="text-[#888] text-base leading-relaxed mb-6">
              Launch a quest, define the tasks, and reach an audience of onchain
              users hunting for the next great project. No engineering required.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/campaigns/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create campaign
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#2A2A2A] bg-[#141414] hover:border-[#FF5C00]/40 text-white text-sm font-semibold"
              >
                View dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-y border-[#141414] bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-2">
              FAQ
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Common questions
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative rounded-2xl border border-[#FF5C00]/30 bg-gradient-to-br from-[#FF5C00]/10 via-[#141414] to-[#0F0F0F] overflow-hidden p-10 sm:p-14 text-center">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FF5C00]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2
              className="text-3xl sm:text-5xl font-black mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The next airdrop is one quest away.
            </h2>
            <p className="text-[#AAA] text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Join thousands of users earning rewards from the projects shaping the next cycle.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/campaigns"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white font-semibold transition-colors shadow-lg shadow-[#FF5C00]/30"
              >
                Explore campaigns
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/campaigns/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-[#2A2A2A] bg-[#141414]/80 hover:border-[#FF5C00]/50 text-white font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Launch your quest
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-black text-[#FF5C00]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              DROPFORGE
            </span>
            <span className="text-[#444] text-xs">· quest-to-airdrop</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-[#666]">
            <a href="/campaigns" className="hover:text-white">Campaigns</a>
            <a href="/leaderboard/1" className="hover:text-white">Leaderboard</a>
            <a href="/dashboard" className="hover:text-white">Dashboard</a>
            <a href="/campaigns/new" className="hover:text-[#FF5C00]">Create</a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white inline-flex items-center gap-1"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-xl border border-[#1E1E1E] bg-[#141414] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#181818] transition-colors"
      >
        <span
          className="text-sm sm:text-base font-semibold text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {q}
        </span>
        <span
          className={`w-6 h-6 rounded-full border border-[#FF5C00]/30 text-[#FF5C00] flex items-center justify-center transition-transform ${
            open ? 'rotate-45' : ''
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-[#999] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
