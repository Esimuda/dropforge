'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProjectDashboard } from '@/hooks/useProject';
import type { CampaignStatus } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function daysUntil(iso: string) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Ended';
  if (days === 0) return 'Today';
  return `${days}d left`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
  sub?: string;
}

function KpiCard({ label, value, icon, accent, sub }: KpiCardProps) {
  return (
    <div className="relative rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-5 overflow-hidden group hover:border-[#2A2A2A] transition-colors">
      {/* Accent glow */}
      <div
        className="absolute top-0 right-0 h-24 w-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />

      <div className="relative">
        <div
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          style={{ background: accent + '15', color: accent }}
        >
          {icon}
        </div>
        <div
          className="text-3xl font-black text-white tracking-tight mb-0.5"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent === '#FF5C00' ? accent : 'white' }}
        >
          {value}
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-[#555]">{label}</div>
        {sub && <div className="text-xs text-[#444] mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'LIVE', color: '#22c55e', bg: '#22c55e15' },
    draft: { label: 'DRAFT', color: '#777', bg: '#2A2A2A' },
    ended: { label: 'ENDED', color: '#ef4444', bg: '#ef444415' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider"
      style={{ color: s.color, background: s.bg }}
    >
      {status === 'active' && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: s.color }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: s.color }} />
        </span>
      )}
      {s.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-[#1A1A1A]', className)} />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDashboardPage() {
  const { data, isLoading } = useProjectDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const { project, stats, campaigns } = data;

  const kpiCards: KpiCardProps[] = [
    {
      label: 'Total Campaigns',
      value: stats.totalCampaigns,
      icon: '📋',
      accent: '#3B82F6',
    },
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: '🟢',
      accent: '#22c55e',
    },
    {
      label: 'Total Entries',
      value: formatCompact(stats.totalEntries),
      icon: '👥',
      accent: '#FF5C00',
      sub: stats.totalEntries.toLocaleString() + ' total',
    },
    {
      label: 'Verified',
      value: formatCompact(stats.verifiedParticipants),
      icon: '✅',
      accent: '#a855f7',
    },
    {
      label: 'Wallets',
      value: formatCompact(stats.walletsCollected),
      icon: '💳',
      accent: '#14b8a6',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: '📈',
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top nav */}
      <div className="border-b border-[#141414] bg-[#080808] px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-black text-[#FF5C00]"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          DROP<span className="text-white">FORGE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/project/campaigns/create"
            className="rounded-lg bg-[#FF5C00] px-4 py-2 text-sm font-bold text-white hover:bg-[#e05200] transition-colors"
          >
            + New Campaign
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Project Header */}
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={project.logo}
                alt={project.name}
                className="h-16 w-16 rounded-2xl object-cover border border-[#2A2A2A]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://api.dicebear.com/8.x/shapes/svg?seed=fallback&backgroundColor=333333';
                }}
              />
              {project.verified && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#3B82F6] border-2 border-[#0E0E0E] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1
                  className="text-2xl font-black text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {project.name}
                </h1>
                {project.verified && (
                  <span className="rounded-full bg-[#3B82F6]/15 px-2.5 py-0.5 text-xs font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                    ✓ Verified
                  </span>
                )}
                <span className="rounded-full bg-[#1A1A1A] border border-[#2A2A2A] px-2.5 py-0.5 text-xs font-bold text-[#777]">
                  {project.chain}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-[#555]">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#FF5C00] transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4 6.5h5M6.5 2.5c-1 1.5-1 5 0 7M6.5 2.5c1 1.5 1 5 0 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    {project.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {project.twitter && (
                  <a
                    href={`https://twitter.com/${project.twitter.slice(1)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#1DA1F2] transition-colors"
                  >
                    <span className="font-bold text-xs">𝕏</span>
                    {project.twitter}
                  </a>
                )}
                {project.discord && (
                  <a
                    href={`https://${project.discord}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#5865F2] transition-colors"
                  >
                    <span>💬</span>
                    {project.discord}
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-sm text-[#777] hover:text-white hover:border-[#444] transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        {/* Campaigns table */}
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414]">
            <h2
              className="text-base font-black text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Campaigns
            </h2>
            <Link
              href="/project/campaigns/create"
              className="rounded-lg bg-[#FF5C00] px-4 py-2 text-sm font-bold text-white hover:bg-[#e05200] transition-colors"
            >
              + Create Campaign
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-[#555] font-medium mb-4">No campaigns yet</p>
              <Link
                href="/project/campaigns/create"
                className="inline-block rounded-lg bg-[#FF5C00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e05200] transition-colors"
              >
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-[#141414]">
                    {[
                      'Campaign',
                      'Status',
                      'Participants',
                      'Wallets',
                      'Pending',
                      'Completion',
                      'Deadline',
                      'Actions',
                    ].map((col, i) => (
                      <th
                        key={col}
                        className={cn(
                          'px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#444]',
                          i === 0 ? 'text-left' : i === 7 ? 'text-right' : 'text-left',
                        )}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0E0E0E]">
                  {campaigns.map((campaign) => {
                    const deadline = daysUntil(campaign.endDate);
                    const isUrgent =
                      typeof deadline === 'string' &&
                      deadline.includes('d') &&
                      parseInt(deadline) <= 3;

                    return (
                      <tr
                        key={campaign.id}
                        className="hover:bg-[#111] transition-colors group"
                      >
                        {/* Campaign name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {campaign.bannerImage ? (
                              <img
                                src={campaign.bannerImage}
                                alt=""
                                className="h-9 w-14 rounded-lg object-cover shrink-0 border border-[#1A1A1A]"
                              />
                            ) : (
                              <div className="h-9 w-14 rounded-lg bg-[#1A1A1A] shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-white group-hover:text-[#FF5C00] transition-colors">
                                {campaign.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-[#444]">{campaign.chain}</span>
                                <span className="text-[#333]">·</span>
                                <span className="text-xs text-[#444] capitalize">
                                  {campaign.rewardType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={campaign.status} />
                        </td>

                        {/* Participants */}
                        <td className="px-5 py-4 font-semibold text-white">
                          {formatCompact(campaign.participantCount)}
                        </td>

                        {/* Wallets */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-[#14b8a6]">
                            {formatCompact(campaign.walletsCollected)}
                          </span>
                        </td>

                        {/* Pending */}
                        <td className="px-5 py-4">
                          {campaign.pendingVerifications > 0 ? (
                            <span className="rounded-full bg-[#f59e0b]/15 px-2.5 py-1 text-xs font-bold text-[#f59e0b]">
                              {campaign.pendingVerifications} pending
                            </span>
                          ) : (
                            <span className="text-xs text-[#444]">—</span>
                          )}
                        </td>

                        {/* Completion */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#FF5C00]"
                                style={{ width: `${campaign.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#777]">
                              {campaign.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="px-5 py-4">
                          <div>
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                isUrgent
                                  ? 'text-red-400'
                                  : deadline === 'Ended'
                                  ? 'text-[#444]'
                                  : 'text-[#22c55e]',
                              )}
                            >
                              {deadline}
                            </span>
                            <p className="text-xs text-[#444] mt-0.5">{formatDate(campaign.endDate)}</p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/project/campaigns/${campaign.id}/participants`}
                              className="rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-xs font-semibold text-[#777] hover:text-white hover:border-[#444] transition-colors whitespace-nowrap"
                            >
                              Participants
                            </Link>
                            <Link
                              href={`/project/campaigns/${campaign.id}/export`}
                              className="rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-xs font-semibold text-[#777] hover:text-white hover:border-[#444] transition-colors"
                            >
                              Export
                            </Link>
                            <button className="rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-xs font-semibold text-[#777] hover:text-white hover:border-[#444] transition-colors">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '📝',
              title: 'Register New Project',
              desc: 'Create another project under your account',
              href: '/project/register',
              color: '#3B82F6',
            },
            {
              icon: '🚀',
              title: 'Create Campaign',
              desc: 'Launch a new quest or airdrop campaign',
              href: '/project/campaigns/create',
              color: '#FF5C00',
            },
            {
              icon: '👥',
              title: 'View Participants',
              desc: 'Manage all campaign participants',
              href: campaigns[0]
                ? `/project/campaigns/${campaigns[0].id}/participants`
                : '/project/dashboard',
              color: '#a855f7',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-5 hover:border-[#2A2A2A] transition-all hover:bg-[#111]"
            >
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-transform group-hover:scale-110"
                style={{ background: action.color + '15' }}
              >
                {action.icon}
              </div>
              <h3
                className="font-bold text-white mb-1 group-hover:text-[#FF5C00] transition-colors"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {action.title}
              </h3>
              <p className="text-xs text-[#555]">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
