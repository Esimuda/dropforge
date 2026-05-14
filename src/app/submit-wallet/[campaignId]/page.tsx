'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WalletForm } from '@/components/ui/WalletForm';
import { useSubmitWallet, useUpdateWallet, useWalletEntry } from '@/hooks/useUser';
import { useCampaign } from '@/hooks/useLeaderboard';
import { mockCampaigns } from '@/lib/mockData';
import type { WalletEntry } from '@/types';

const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(args));

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getCountdown(endDate: string): { text: string; isUrgent: boolean } {
  try {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return { text: 'Campaign Ended', isUrgent: false };
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const isUrgent = diff < 3 * 24 * 60 * 60 * 1000;
    let text = '';
    if (d > 0) text = `${d}d ${h}h remaining`;
    else if (h > 0) text = `${h}h ${m}m remaining`;
    else text = `${m}m remaining`;
    return { text, isUrgent };
  } catch {
    return { text: '', isUrgent: false };
  }
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

// ─── Campaign Context Bar ──────────────────────────────────────────────────────
function CampaignContextBar({
  campaign,
}: {
  campaign: {
    id: string;
    name: string;
    projectName: string;
    projectLogo: string;
    chain: string;
    rewardType: string;
    endDate: string;
  };
}) {
  const chainColor = CHAIN_COLORS[campaign.chain] ?? '#FF5C00';
  const { text: countdown, isUrgent } = getCountdown(campaign.endDate);

  return (
    <div className="rounded-xl border border-[#222] bg-[#141414] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <img
          src={campaign.projectLogo}
          alt={campaign.projectName}
          className="w-12 h-12 rounded-xl bg-[#1E1E1E] flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://api.dicebear.com/8.x/shapes/svg?seed=${campaign.id}&backgroundColor=FF5C00`;
          }}
        />
        <div>
          <h2
            className="font-bold text-white text-sm leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {campaign.name}
          </h2>
          <p className="text-[#666] text-xs mt-0.5">{campaign.projectName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono border"
          style={{
            color: chainColor,
            borderColor: `${chainColor}40`,
            backgroundColor: `${chainColor}10`,
          }}
        >
          {campaign.chain}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20">
          {REWARD_LABELS[campaign.rewardType] ?? campaign.rewardType}
        </span>
        {countdown && (
          <span
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-mono',
              isUrgent
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                : 'bg-[#1E1E1E] text-[#666] border border-[#2A2A2A]'
            )}
          >
            {isUrgent && '⚡ '}
            {countdown}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SubmitWalletPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId ?? '1';

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: existingEntry, isLoading: entryLoading } = useWalletEntry(campaignId);
  const submitMutation = useSubmitWallet();
  const updateMutation = useUpdateWallet();

  const [submittedEntry, setSubmittedEntry] = useState<WalletEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = campaignLoading || entryLoading || !mounted;

  // Determine whether we're showing the success state after submission
  const showSuccess =
    !isEditing &&
    (submitMutation.isSuccess || updateMutation.isSuccess) &&
    (submittedEntry != null);

  const activeMutation = existingEntry && !submitMutation.isPending
    ? updateMutation
    : submitMutation;

  const mutationError =
    (submitMutation.error?.message) ||
    (updateMutation.error?.message) ||
    null;

  const resolvedCampaign = campaign ?? mockCampaigns.find((c) => c.id === campaignId) ?? mockCampaigns[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF5C00]/30 border-t-[#FF5C00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="text-[#555] hover:text-white transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <span
              className="text-xl font-black text-[#FF5C00] tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              DROPFORGE
            </span>
          </div>
          <a
            href={`/leaderboard/${campaignId}`}
            className="text-sm text-[#666] hover:text-[#FF5C00] transition-colors"
          >
            Leaderboard →
          </a>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Campaign context */}
        <CampaignContextBar campaign={resolvedCampaign} />

        {/* Heading */}
        <div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {existingEntry && !isEditing ? 'Your Submission' : 'Submit Your Wallet'}
          </h1>
          <p className="text-[#666] text-sm">
            {existingEntry && !isEditing
              ? 'Your wallet is registered for this campaign.'
              : 'Register your wallet to receive airdrop rewards.'}
          </p>
        </div>

        {/* Warning banner */}
        {!showSuccess && (
          <div className="flex items-start gap-3 px-4 py-4 rounded-xl border border-[#FF5C00]/25 bg-[#FF5C00]/5">
            <svg
              className="w-5 h-5 text-[#FF5C00] flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <div>
              <p className="text-[#FF5C00] text-sm font-semibold mb-0.5">
                Double-check your address
              </p>
              <p className="text-[#AA8060] text-xs leading-relaxed">
                This wallet will receive your airdrop rewards. Verify the address
                carefully before submitting. You can edit your submission until the
                campaign deadline.
              </p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#111] p-6 sm:p-8">
          <WalletForm
            campaignId={campaignId}
            preferredChain={resolvedCampaign.chain as Parameters<typeof WalletForm>[0]['preferredChain']}
            existingEntry={existingEntry}
            onSubmit={async (payload) => {
              let result: WalletEntry;
              if (existingEntry) {
                result = await updateMutation.mutateAsync({
                  campaignId,
                  id: existingEntry.id,
                  walletAddress: payload.walletAddress,
                  chain: payload.chain,
                });
              } else {
                result = await submitMutation.mutateAsync(payload);
              }
              setSubmittedEntry(result);
              setIsEditing(false);
              return result;
            }}
            isSubmitting={submitMutation.isPending || updateMutation.isPending}
            isSuccess={showSuccess}
            submittedEntry={showSuccess ? submittedEntry : undefined}
            error={mutationError}
            onEditRequest={() => setIsEditing(true)}
            campaignDeadline={resolvedCampaign.endDate}
          />
        </div>

        {/* Help note */}
        {!showSuccess && (
          <div className="text-center">
            <p className="text-[#444] text-xs">
              Need help?{' '}
              <a
                href="/support"
                className="text-[#FF5C00]/70 hover:text-[#FF5C00] transition-colors underline underline-offset-2"
              >
                Contact support
              </a>
            </p>
          </div>
        )}

        {/* Back links */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href={`/campaigns/${campaignId}`}
            className="text-sm text-[#555] hover:text-[#888] transition-colors"
          >
            ← Back to campaign
          </a>
          <span className="text-[#2A2A2A]">·</span>
          <a
            href="/dashboard"
            className="text-sm text-[#555] hover:text-[#888] transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
