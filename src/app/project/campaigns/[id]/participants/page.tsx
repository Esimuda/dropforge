'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '../../../../../components/common/Navbar';
import ParticipantTable from '../../../../../components/project/ParticipantTable';
import WhitelistSelector from '../../../../../components/project/WhitelistSelector';
import LoadingSkeleton from '../../../../../components/common/LoadingSkeleton';
import { useParticipants, useUpdateParticipantStatus } from '@/hooks/useProject';
import { useCampaign } from '@/hooks/useCampaigns';

export default function ParticipantsPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id ?? '';
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: participants, isLoading: listLoading } = useParticipants(campaignId);
  const updateStatus = useUpdateParticipantStatus();

  const participantsView = useMemo(() => {
    const totalTasks =
      campaign?.tasks?.length ?? campaign?.taskCount ?? 6;
    return (participants ?? []).map((p) => ({ ...p, totalTasks }));
  }, [participants, campaign]);

  const loading = campaignLoading || listLoading;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#555] mb-2">
              <Link href="/project/dashboard" className="hover:text-[#FF5C00] transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span>Participants</span>
            </div>
            {loading && !campaign ? (
              <LoadingSkeleton className="h-9 w-72" />
            ) : (
              <h1 className="font-space-grotesk text-3xl font-bold">
                {campaign ? campaign.name : 'Participants'}
              </h1>
            )}
            <p className="mt-2 text-sm text-[#666]">
              Approve or reject maps to whitelist on the API. Use bulk actions for multiple users.
            </p>
          </div>
          {campaignId && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/project/campaigns/${campaignId}/export`}
                className="rounded-xl border border-[#2A2A2A] px-4 py-2.5 text-sm font-semibold text-[#aaa] hover:border-[#444] hover:text-white transition-colors"
              >
                Export data
              </Link>
              <Link
                href="/campaigns/new"
                className="rounded-xl bg-[#FF5C00] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e05200] transition-colors"
              >
                New campaign
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <WhitelistSelector
              campaignId={campaignId}
              participants={participantsView}
            />
            <ParticipantTable
              participants={participantsView}
              isLoading={false}
              onStatusUpdate={(userId, status, note) => {
                if (!campaignId) return;
                updateStatus.mutate({ campaignId, userId, status, note });
              }}
            />
          </div>
        )}
      </section>
    </main>
  );
}
