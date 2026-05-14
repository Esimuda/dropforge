'use client';

import { useQuery } from '@tanstack/react-query';
import { api, USE_MOCK, fetchCampaign } from '@/lib/api';
import { mockLeaderboard, mockCampaigns } from '@/lib/mockData';
import type { LeaderboardEntry, Campaign } from '@/types';
import { extractPagedRows, mapApiLeaderboardRow } from '@/lib/api-mappers';

import { campaignKeys } from '@/hooks/useCampaigns';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  campaign: (campaignId: string) => [...leaderboardKeys.all, campaignId] as const,
};

export function useLeaderboard(campaignId: string) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: leaderboardKeys.campaign(campaignId),
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (USE_MOCK) {
        return mockLeaderboard;
      }
      try {
        const raw = await api.get<unknown>(
          `/campaigns/${campaignId}/leaderboard?page=1&limit=100`,
        );
        const rows = extractPagedRows<{
          rank: number;
          userId: string;
          pointsEarned: number;
          user?: { username?: string | null; avatarUrl?: string | null };
        }>(raw);
        return rows.map((r) => mapApiLeaderboardRow(r));
      } catch {
        return mockLeaderboard;
      }
    },
    enabled: Boolean(campaignId),
    staleTime: 15_000,
    retry: 1,
    placeholderData: mockLeaderboard,
  });
}

/** Campaign summary for pages that only import leaderboard hooks. */
export function useCampaign(campaignId: string) {
  return useQuery<Campaign>({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: async (): Promise<Campaign> => {
      if (USE_MOCK) {
        const fallback = mockCampaigns.find((c) => c.id === campaignId);
        return fallback ?? mockCampaigns[0];
      }
      try {
        return await fetchCampaign(campaignId);
      } catch {
        const fallback = mockCampaigns.find((c) => c.id === campaignId);
        return fallback ?? mockCampaigns[0];
      }
    },
    enabled: Boolean(campaignId),
    staleTime: 60_000,
    retry: 1,
  });
}
