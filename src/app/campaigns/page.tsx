// Campaign browser: /campaigns
'use client';

import React from 'react';
import Navbar from '../../components/common/Navbar';
import CampaignCard from '../../components/common/CampaignCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { useCampaigns } from '@/hooks/useCampaigns';
import type { Campaign } from '@/types';

export default function CampaignsPage() {
  const { data: campaigns, isLoading, error } = useCampaigns();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="font-space-grotesk text-3xl md:text-5xl font-bold mb-8">Browse Campaigns</h1>
        {/* TODO: Filters, search bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-48 w-full" />
          ))}
          {!isLoading && campaigns && campaigns.length > 0 && campaigns.map((campaign: Campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
          {!isLoading && (!campaigns || campaigns.length === 0) && (
            <div className="col-span-full">
              <EmptyState message="No campaigns found. Check back soon!" />
            </div>
          )}
          {error && (
            <div className="col-span-full text-red-500">Failed to load campaigns.</div>
          )}
        </div>
      </section>
    </main>
  );
}
