'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/common/Navbar';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import EmptyState from '../../../components/common/EmptyState';
import { useLeaderboard, useCampaign } from '@/hooks/useLeaderboard';
import { useCurrentUser } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : rank === 2
        ? 'bg-slate-400/15 text-slate-200 border-slate-400/35'
        : rank === 3
          ? 'bg-orange-700/25 text-orange-200 border-orange-600/40'
          : 'bg-[#1A1A1A] text-[#888] border-[#2A2A2A]';
  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-black',
        tone,
      )}
    >
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId ?? '';
  const { user } = useCurrentUser();
  const currentUserId = user?.id;

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: rows, isLoading: boardLoading, error } = useLeaderboard(campaignId);

  const loading = campaignLoading || boardLoading;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">
              Campaign
            </p>
            {loading && !campaign ? (
              <LoadingSkeleton className="h-9 w-64" />
            ) : (
              <h1 className="font-space-grotesk text-3xl font-bold">
                {campaign?.name ?? 'Leaderboard'}
              </h1>
            )}
            {campaign && (
              <p className="mt-2 text-sm text-[#777]">
                {campaign.projectName} · Top {rows?.length ?? 0} by points
              </p>
            )}
          </div>
          {campaignId && (
            <Link
              href={`/campaigns/${campaignId}`}
              className="inline-flex items-center justify-center rounded-xl border border-[#2A2A2A] px-4 py-2.5 text-sm font-semibold text-[#aaa] hover:border-[#444] hover:text-white transition-colors"
            >
              ← Back to campaign
            </Link>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState message="Could not load leaderboard. Try again later." />
        )}

        {!loading && !error && (!rows || rows.length === 0) && (
          <EmptyState message="No entries yet. Be the first to earn points!" />
        )}

        {!loading && rows && rows.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#141414] text-xs font-semibold uppercase tracking-widest text-[#555]">
                  <th className="px-4 py-3 w-16">#</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]">
                {rows.map((entry: LeaderboardEntry) => {
                  const highlight =
                    Boolean(currentUserId && entry.userId === currentUserId) ||
                    entry.isCurrentUser;
                  return (
                    <tr
                      key={`${entry.rank}-${entry.userId}`}
                      className={cn(
                        'transition-colors',
                        highlight ? 'bg-[#FF5C00]/8' : 'hover:bg-[#111]',
                      )}
                    >
                      <td className="px-4 py-3 align-middle">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.avatar}
                            alt=""
                            className="h-10 w-10 rounded-full border border-[#2A2A2A] bg-[#1A1A1A]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{entry.username}</span>
                              {highlight && (
                                <span className="rounded-full bg-[#FF5C00]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#FF5C00]">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#555] font-mono truncate max-w-[200px] sm:max-w-xs">
                              {entry.userId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-right font-bold text-[#FF5C00]">
                        {entry.points.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-middle text-right text-[#888] hidden sm:table-cell">
                        {entry.tasksCompleted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
