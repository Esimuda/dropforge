// Campaign detail: /campaigns/[id]
import React from 'react';
import Navbar from '../../../components/common/Navbar';
import TaskItem from '../../../components/common/TaskItem';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import EmptyState from '../../../components/common/EmptyState';
import { useParams } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaigns';
import type { Task } from '@/types';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id;
  const { data: campaign, isLoading, error } = useCampaign(campaignId);

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
            {!isLoading && error && (
              <EmptyState message="Failed to load campaign." />
            )}
            {!isLoading && campaign && (
              <>
                <h1 className="font-space-grotesk text-3xl font-bold mb-4">{campaign.name}</h1>
                <p className="mb-6">{campaign.description}</p>
                <div className="space-y-4">
                  {campaign.tasks && campaign.tasks.length > 0 ? (
                    campaign.tasks.map((task: Task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  ) : (
                    <EmptyState message="No tasks for this campaign yet." />
                  )}
                </div>
              </>
            )}
          </div>
          <aside className="bg-[#1A1A1A] rounded-xl p-6">
            {/* TODO: Progress, points, join/submit wallet CTA */}
          </aside>
        </div>
      </section>
    </main>
  );
}
