'use client';

import React, { useMemo, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import CampaignCard from '../../components/common/CampaignCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { useCampaigns } from '@/hooks/useCampaigns';
import type { Campaign, CampaignStatus, Chain, RewardType } from '@/types';

const CHAINS: { value: Chain | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All chains' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'BASE', label: 'Base' },
  { value: 'ARB', label: 'Arbitrum' },
  { value: 'MATIC', label: 'Polygon' },
  { value: 'BNB', label: 'BNB' },
  { value: 'SOL', label: 'Solana' },
  { value: 'AVAX', label: 'Avalanche' },
];

const REWARDS: { value: RewardType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All rewards' },
  { value: 'airdrop', label: 'Airdrop' },
  { value: 'whitelist', label: 'Whitelist' },
  { value: 'both', label: 'Airdrop + WL' },
];

const STATUSES: { value: CampaignStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Active (default)' },
  { value: 'active', label: 'Live' },
  { value: 'ended', label: 'Ended' },
  { value: 'draft', label: 'Draft' },
];

export default function CampaignsPage() {
  const [chain, setChain] = useState<Chain | 'ALL'>('ALL');
  const [rewardType, setRewardType] = useState<RewardType | 'ALL'>('ALL');
  const [status, setStatus] = useState<CampaignStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const { data: rawCampaigns, isLoading, error } = useCampaigns({
    chain,
    rewardType,
    status,
  });

  const campaigns = useMemo(() => {
    if (!rawCampaigns) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rawCampaigns;
    return rawCampaigns.filter(
      (c: Campaign) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q),
    );
  }, [rawCampaigns, search]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="font-space-grotesk text-3xl md:text-5xl font-bold mb-8">Browse Campaigns</h1>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative flex-1 min-w-0 max-w-xl">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M8 14a6 6 0 100-12 6 6 0 000 12zM16 16l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              placeholder="Search name, project, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#111] py-3 pl-11 pr-4 text-sm text-white placeholder-[#555] focus:border-[#FF5C00]/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as Chain | 'ALL')}
              className="rounded-xl border border-[#2A2A2A] bg-[#111] px-3 py-2.5 text-sm text-[#ccc] focus:border-[#FF5C00]/40 focus:outline-none min-w-[140px]"
            >
              {CHAINS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value as RewardType | 'ALL')}
              className="rounded-xl border border-[#2A2A2A] bg-[#111] px-3 py-2.5 text-sm text-[#ccc] focus:border-[#FF5C00]/40 focus:outline-none min-w-[140px]"
            >
              {REWARDS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampaignStatus | 'ALL')}
              className="rounded-xl border border-[#2A2A2A] bg-[#111] px-3 py-2.5 text-sm text-[#ccc] focus:border-[#FF5C00]/40 focus:outline-none min-w-[160px]"
            >
              {STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#555]">
          Chain and reward filters apply on the server. Search narrows the current results in the browser.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          {!isLoading &&
            campaigns.length > 0 &&
            campaigns.map((campaign: Campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          {!isLoading && campaigns.length === 0 && (
            <div className="col-span-full">
              <EmptyState message="No campaigns match your filters. Try clearing search or widening filters." />
            </div>
          )}
          {error && (
            <div className="col-span-full text-red-400 text-sm">Failed to load campaigns.</div>
          )}
        </div>
      </section>
    </main>
  );
}
