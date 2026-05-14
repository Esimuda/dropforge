'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/common/Navbar';
import TaskItem from '../../../components/common/TaskItem';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import EmptyState from '../../../components/common/EmptyState';
import { useParams } from 'next/navigation';
import { useCampaign, useJoinCampaign } from '@/hooks/useCampaigns';
import { useCurrentUser } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id;
  const { data: campaign, isLoading, error } = useCampaign(campaignId ?? '');
  const joinMutation = useJoinCampaign();
  const { user, isWalletConnected } = useCurrentUser();
  const joinedCampaigns = useAppStore((s) => s.joinedCampaigns);

  const isJoined = Boolean(campaignId && joinedCampaigns.includes(campaignId));
  const canJoin = Boolean(user || isWalletConnected);

  const tasks = campaign?.tasks ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending_verification').length;
  const pointsEarned = useMemo(
    () => tasks.filter((t) => t.status === 'completed').reduce((s, t) => s + t.points, 0),
    [tasks],
  );
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const showWalletCta =
    isJoined &&
    campaign &&
    (campaign.rewardType === 'airdrop' || campaign.rewardType === 'both');

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {isLoading && (
              <>
                <LoadingSkeleton className="h-10 w-2/3 mb-4" />
                <LoadingSkeleton className="h-6 w-full mb-6" />
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <LoadingSkeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </>
            )}
            {!isLoading && error && <EmptyState message="Failed to load campaign." />}
            {!isLoading && campaign && (
              <>
                <h1 className="font-space-grotesk text-3xl font-bold mb-4">{campaign.name}</h1>
                <p className="mb-6 text-[#aaa]">{campaign.description}</p>
                <div className="space-y-4">
                  {tasks.length > 0 ? (
                    tasks.map((task: Task) => <TaskItem key={task.id} task={task} />)
                  ) : (
                    <EmptyState message="No tasks for this campaign yet." />
                  )}
                </div>
              </>
            )}
          </div>

          <aside className="md:col-span-1">
            <div className="sticky top-6 space-y-4 rounded-xl border border-[#242424] bg-[#1A1A1A] p-6">
              {!isLoading && campaign && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">
                      Progress
                    </p>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white font-semibold">
                        {completedTasks}/{totalTasks || '—'} tasks
                      </span>
                      <span className="text-[#FF5C00] font-bold">{progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#111] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF5C00] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {pendingTasks > 0 && (
                      <p className="mt-2 text-xs text-amber-400">
                        {pendingTasks} task{pendingTasks > 1 ? 's' : ''} awaiting verification
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-[#111] border border-[#2A2A2A] p-4">
                    <p className="text-xs text-[#555] uppercase tracking-wider font-semibold mb-1">
                      Points earned
                    </p>
                    <p className="text-2xl font-black text-[#FF5C00]">{pointsEarned}</p>
                    <p className="text-xs text-[#666] mt-1">
                      of {campaign.pointsAvailable.toLocaleString()} available
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-[#777]">
                    <span className="rounded-md bg-[#222] px-2 py-1">{campaign.chain}</span>
                    <span className="rounded-md bg-[#222] px-2 py-1 capitalize">
                      {campaign.rewardType.replace('_', ' ')}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-1 capitalize',
                        campaign.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : campaign.status === 'draft'
                            ? 'bg-[#333] text-[#999]'
                            : 'bg-red-500/10 text-red-400',
                      )}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  {!isJoined && campaign.status === 'active' && (
                    <>
                      {canJoin ? (
                        <button
                          type="button"
                          disabled={joinMutation.isPending}
                          onClick={() => campaignId && joinMutation.mutate(campaignId)}
                          className="w-full rounded-xl bg-[#FF5C00] py-3 text-sm font-black text-white transition-colors hover:bg-[#e05200] disabled:opacity-60"
                        >
                          {joinMutation.isPending ? 'Joining…' : 'Join campaign'}
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          className="flex w-full items-center justify-center rounded-xl border border-[#2A2A2A] py-3 text-sm font-bold text-white hover:border-[#FF5C00]/50 transition-colors"
                        >
                          Sign in to join
                        </Link>
                      )}
                    </>
                  )}

                  {isJoined && (
                    <p className="text-center text-sm font-semibold text-emerald-400">
                      You&apos;re in this campaign
                    </p>
                  )}

                  {campaign.status !== 'active' && !isJoined && (
                    <p className="text-center text-sm text-[#777]">
                      This campaign is not accepting new participants.
                    </p>
                  )}

                  <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
                    <Link
                      href={`/leaderboard/${campaign.id}`}
                      className="flex w-full items-center justify-center rounded-xl border border-[#2A2A2A] py-2.5 text-sm font-semibold text-[#ccc] hover:border-[#444] hover:text-white transition-colors"
                    >
                      View leaderboard
                    </Link>
                    {showWalletCta && campaignId && (
                      <Link
                        href={`/submit-wallet/${campaignId}`}
                        className="flex w-full items-center justify-center rounded-xl bg-[#111] border border-[#FF5C00]/40 py-2.5 text-sm font-bold text-[#FF5C00] hover:bg-[#FF5C00]/10 transition-colors"
                      >
                        Submit wallet
                      </Link>
                    )}
                  </div>
                </>
              )}
              {isLoading && (
                <div className="space-y-3">
                  <LoadingSkeleton className="h-16 w-full" />
                  <LoadingSkeleton className="h-12 w-full" />
                  <LoadingSkeleton className="h-10 w-full" />
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
