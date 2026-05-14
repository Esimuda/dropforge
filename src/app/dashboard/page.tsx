'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUserDashboard } from '@/hooks/useUser';
import type { Campaign } from '@/types';

const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(args));

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

function getCountdown(endDate: string): string {
  try {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return `${d}d ${h}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  } catch {
    return '';
  }
}

function truncateAddress(addr: string): string {
  if (!addr) return '';
  if (addr.includes('...')) return addr;
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const CHAIN_COLORS: Record<string, string> = {
  ETH: '#627EEA',
  SOL: '#9945FF',
  BNB: '#F3BA2F',
  MATIC: '#8247E5',
  ARB: '#28A0F0',
  BASE: '#0052FF',
  AVAX: '#E84142',
};

const REWARD_LABELS: Record<string, string> = {
  airdrop: 'AIRDROP',
  whitelist: 'WHITELIST',
  both: 'AIRDROP + WL',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5 flex items-center gap-4 transition-all duration-200',
        accent
          ? 'border-[#FF5C00]/30 bg-[#FF5C00]/5'
          : 'border-[#222] bg-[#141414]'
      )}
    >
      <div
        className={cn(
          'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
          accent ? 'bg-[#FF5C00]/15' : 'bg-[#1E1E1E]'
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[#666] text-xs uppercase tracking-wider mb-0.5">{label}</p>
        <p
          className={cn(
            'text-2xl font-bold',
            accent ? 'text-[#FF5C00]' : 'text-white'
          )}
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-[#FF5C00] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Campaign Quest Card ───────────────────────────────────────────────────────
function CampaignQuestCard({
  entry,
}: {
  entry: {
    campaign: Campaign;
    tasksCompleted: number;
    totalTasks: number;
    pointsEarned: number;
    walletSubmitted: boolean;
    lastActivity: string;
  };
}) {
  const { campaign, tasksCompleted, totalTasks, pointsEarned, walletSubmitted } = entry;
  const chainColor = CHAIN_COLORS[campaign.chain] ?? '#FF5C00';
  const countdown = getCountdown(campaign.endDate);
  const isUrgent = (() => {
    try {
      const diff = new Date(campaign.endDate).getTime() - Date.now();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  return (
    <div className="group relative rounded-xl border border-[#222] bg-[#141414] hover:border-[#FF5C00]/30 transition-all duration-300 overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ backgroundColor: chainColor }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <img
              src={campaign.projectLogo}
              alt={campaign.projectName}
              className="w-12 h-12 rounded-lg bg-[#1E1E1E]"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://api.dicebear.com/8.x/shapes/svg?seed=${campaign.id}&backgroundColor=FF5C00`;
              }}
            />
            {campaign.status === 'active' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#141414]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-white text-base leading-tight mb-1 truncate"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {campaign.name}
            </h3>
            <p className="text-[#666] text-xs truncate">{campaign.projectName}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Chain badge */}
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border"
              style={{
                color: chainColor,
                borderColor: `${chainColor}40`,
                backgroundColor: `${chainColor}10`,
              }}
            >
              {campaign.chain}
            </span>
            {/* Reward badge */}
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20">
              {REWARD_LABELS[campaign.rewardType] ?? campaign.rewardType}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#666]">Quest Progress</span>
            <span className="text-xs font-mono text-[#AAA]">
              {tasksCompleted}/{totalTasks} tasks
            </span>
          </div>
          <ProgressBar value={tasksCompleted} max={totalTasks} />
        </div>

        {/* Points + Wallet row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Points earned */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5C00]/8 border border-[#FF5C00]/15">
            <svg className="w-3.5 h-3.5 text-[#FF5C00]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[#FF5C00] text-sm font-bold">{pointsEarned.toLocaleString()} pts</span>
          </div>

          {/* Wallet status */}
          {walletSubmitted ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 text-xs font-medium">Wallet submitted</span>
            </div>
          ) : (
            <a
              href={`/submit-wallet/${campaign.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 hover:bg-red-500/15 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-xs font-medium">Submit wallet</span>
            </a>
          )}

          {/* Countdown */}
          {countdown && (
            <span
              className={cn(
                'ml-auto text-xs font-mono px-2 py-1 rounded',
                isUrgent
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-[#666] bg-[#1E1E1E]'
              )}
            >
              {isUrgent && '⚡ '}
              {countdown}
            </span>
          )}
        </div>

        {/* CTA */}
        <a
          href={`/campaigns/${campaign.id}`}
          className={cn(
            'block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all duration-200',
            'border border-[#FF5C00]/30 text-[#FF5C00]',
            'hover:bg-[#FF5C00] hover:text-white hover:border-[#FF5C00]',
            'group-hover:border-[#FF5C00]/60'
          )}
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Continue Quest →
        </a>
      </div>
    </div>
  );
}

// ─── Activity Icon ─────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'task_completed':
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'campaign_joined':
      return (
        <div className="w-8 h-8 rounded-full bg-[#FF5C00]/15 border border-[#FF5C00]/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#FF5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    case 'wallet_submitted':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

// ─── Notification Dropdown ──────────────────────────────────────────────────────
function NotificationBell({
  pendingCount,
  recentActivity,
}: {
  pendingCount: number;
  recentActivity: Array<{ type: string; description: string; timestamp: string; points?: number }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center hover:border-[#FF5C00]/40 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5C00] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Notifications
              </h3>
              {pendingCount > 0 && (
                <span className="text-xs text-[#FF5C00] font-medium">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {recentActivity.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-[#222] transition-colors"
                >
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#CCC] leading-snug">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#555]">{formatTimeAgo(item.timestamp)}</span>
                      {item.points && (
                        <span className="text-xs text-[#FF5C00] font-medium">+{item.points} pts</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-[#141414] rounded-xl border border-[#1E1E1E]" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-[#141414] rounded-xl border border-[#1E1E1E]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="h-52 bg-[#141414] rounded-xl border border-[#1E1E1E]" />
          <div className="h-52 bg-[#141414] rounded-xl border border-[#1E1E1E]" />
        </div>
        <div className="h-96 bg-[#141414] rounded-xl border border-[#1E1E1E]" />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, isLoading, error } = useUserDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-[#FF5C00] text-4xl mb-4">⚠</p>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Failed to load dashboard
          </h2>
          <p className="text-[#666] text-sm mb-4">Unable to reach the server. Retrying…</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[#FF5C00] text-white text-sm font-medium hover:bg-[#E54E00] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboard = data!;
  const { user, joinedCampaigns, totalPoints, totalCampaigns, walletEntries, recentActivity } = dashboard;
  const pendingVerifications = recentActivity.filter((a) => a.type === 'task_completed').length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="text-xl font-black text-[#FF5C00] tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              DROPFORGE
            </span>
            <span className="hidden sm:block text-[#333] text-lg">/</span>
            <span className="hidden sm:block text-[#666] text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell
              pendingCount={pendingVerifications}
              recentActivity={recentActivity}
            />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#222]">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-sm font-medium text-[#CCC] hidden sm:block">
                {user.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Welcome Hero ── */}
        <div className="relative rounded-2xl border border-[#1E1E1E] bg-gradient-to-br from-[#141414] to-[#0F0F0F] overflow-hidden p-6 sm:p-8">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C00]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-20 h-20 rounded-2xl border-2 border-[#FF5C00]/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://api.dicebear.com/8.x/shapes/svg?seed=${user.username}&backgroundColor=FF5C00`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#141414]" />
            </div>

            <div className="flex-1">
              <p className="text-[#666] text-sm mb-1">Welcome back,</p>
              <h1
                className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {user.twitterHandle && (
                  <span className="flex items-center gap-1.5 text-[#666] text-xs">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {user.twitterHandle}
                  </span>
                )}
                {user.discordHandle && (
                  <span className="flex items-center gap-1.5 text-[#666] text-xs">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.001.024.014.05.033.067a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                    </svg>
                    {user.discordHandle}
                  </span>
                )}
                {user.walletAddress && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-xs font-mono">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {truncateAddress(user.walletAddress)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-[#555] text-xs uppercase tracking-widest mb-1">Total Points</p>
              <p
                className="text-5xl sm:text-6xl font-black text-[#FF5C00] tabular-nums"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {totalPoints.toLocaleString()}
              </p>
              <p className="text-[#555] text-xs mt-0.5">pts earned</p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Campaigns Joined"
            value={totalCampaigns}
            accent={false}
            icon={
              <svg className="w-5 h-5 text-[#FF5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            label="Total Points Earned"
            value={totalPoints.toLocaleString()}
            accent={true}
            icon={
              <svg className="w-5 h-5 text-[#FF5C00]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
          />
          <StatCard
            label="Wallets Submitted"
            value={walletEntries.length || joinedCampaigns.filter((j) => j.walletSubmitted).length}
            accent={false}
            icon={
              <svg className="w-5 h-5 text-[#FF5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Quests — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Active Quests
              </h2>
              <a
                href="/campaigns"
                className="text-sm text-[#FF5C00] hover:text-[#FF8040] transition-colors font-medium"
              >
                Browse all →
              </a>
            </div>

            {joinedCampaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2A2A2A] bg-[#0F0F0F] p-12 text-center">
                <div className="text-5xl mb-4">🔥</div>
                <h3
                  className="text-lg font-bold text-white mb-2"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  No quests yet
                </h3>
                <p className="text-[#555] text-sm mb-5">
                  Explore campaigns and start earning airdrop rewards.
                </p>
                <a
                  href="/campaigns"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5C00] text-white text-sm font-semibold hover:bg-[#E54E00] transition-colors"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Browse Campaigns
                </a>
              </div>
            ) : (
              joinedCampaigns.map((entry) => (
                <CampaignQuestCard key={entry.campaign.id} entry={entry} />
              ))
            )}
          </div>

          {/* Recent Activity Sidebar — 1/3 */}
          <div>
            <div className="sticky top-24">
              <h2
                className="text-xl font-bold text-white mb-4"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Recent Activity
              </h2>

              <div className="rounded-xl border border-[#1E1E1E] bg-[#141414] overflow-hidden">
                {recentActivity.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[#444] text-sm">No activity yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1A1A1A]">
                    {recentActivity.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 hover:bg-[#171717] transition-colors">
                        <ActivityIcon type={item.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#CCC] leading-snug">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#444]">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                            {item.points && (
                              <span className="text-xs text-[#FF5C00] font-medium">
                                +{item.points} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leaderboard quick link */}
                <div className="p-4 border-t border-[#1A1A1A] bg-[#111]">
                  <a
                    href="/leaderboard/1"
                    className="flex items-center justify-between text-sm text-[#666] hover:text-[#FF5C00] transition-colors group"
                  >
                    <span>View leaderboard</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
