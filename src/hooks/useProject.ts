'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, fetchProjectCampaigns, fetchParticipants, USE_MOCK } from '@/lib/api';
import type { Campaign, Participant, Chain } from '@/types';
import {
  buildCreateCampaignBody,
  mapApiCampaignDetail,
  type ApiCampaignRow,
} from '@/lib/api-mappers';

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const mockProjectDashboard: ProjectDashboard = {
  project: {
    id: 'proj-1',
    name: 'Phantom Protocol',
    logo: 'https://api.dicebear.com/8.x/shapes/svg?seed=phantom&backgroundColor=FF5C00',
    website: 'https://phantom.xyz',
    twitter: '@PhantomProtocol',
    discord: 'discord.gg/phantom',
    chain: 'ETH',
    verified: true,
  },
  stats: {
    totalCampaigns: 3,
    activeCampaigns: 1,
    totalEntries: 12847,
    verifiedParticipants: 9234,
    walletsCollected: 8901,
    completionRate: 71.8,
  },
  campaigns: [
    {
      id: '1',
      name: 'Phantom Genesis Airdrop',
      description: 'The inaugural airdrop campaign for early Phantom Protocol supporters.',
      projectName: 'Phantom Protocol',
      projectLogo: 'https://api.dicebear.com/8.x/shapes/svg?seed=phantom&backgroundColor=FF5C00',
      bannerImage:
        'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=300&fit=crop',
      chain: 'ETH',
      rewardType: 'both',
      status: 'active',
      taskCount: 6,
      participantCount: 12847,
      pointsAvailable: 1500,
      startDate: '2024-01-01T00:00:00Z',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      walletsCollected: 8901,
      pendingVerifications: 234,
      completionRate: 71.8,
    },
    {
      id: '2',
      name: 'Phantom Whitelist Round 2',
      description: 'Secure your spot in the next Phantom Protocol whitelist.',
      projectName: 'Phantom Protocol',
      projectLogo: 'https://api.dicebear.com/8.x/shapes/svg?seed=phantom&backgroundColor=FF5C00',
      bannerImage:
        'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=300&fit=crop',
      chain: 'ETH',
      rewardType: 'whitelist',
      status: 'ended',
      taskCount: 4,
      participantCount: 5230,
      pointsAvailable: 800,
      startDate: '2023-11-01T00:00:00Z',
      endDate: '2023-12-31T00:00:00Z',
      createdAt: '2023-11-01T00:00:00Z',
      walletsCollected: 4980,
      pendingVerifications: 0,
      completionRate: 88.4,
    },
    {
      id: '3',
      name: 'Community Airdrop Q1 2025',
      description: 'Draft campaign for Q1 community airdrop.',
      projectName: 'Phantom Protocol',
      projectLogo: 'https://api.dicebear.com/8.x/shapes/svg?seed=phantom&backgroundColor=FF5C00',
      bannerImage: '',
      chain: 'ETH',
      rewardType: 'airdrop',
      status: 'draft',
      taskCount: 0,
      participantCount: 0,
      pointsAvailable: 0,
      startDate: '',
      endDate: '',
      createdAt: new Date().toISOString(),
      walletsCollected: 0,
      pendingVerifications: 0,
      completionRate: 0,
    },
  ],
};

export const mockParticipants: Participant[] = Array.from({ length: 50 }, (_, i) => ({
  id: `p-${i}`,
  userId: `user-${i}`,
  username:
    ['CryptoWizard', 'SolanaQueen', 'DegenKing', 'NFTHunter', 'AirdropPro'][i % 5] + i,
  avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${i}`,
  walletSubmitted: i % 3 !== 0,
  walletAddress:
    i % 3 !== 0
      ? `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`
      : undefined,
  walletChain: i % 3 !== 0 ? 'ETH' : undefined,
  tasksCompleted: Math.floor(Math.random() * 6) + 1,
  totalTasks: 6,
  points: Math.floor(Math.random() * 1500) + 100,
  status: i % 5 === 0 ? 'ineligible' : 'eligible',
  joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

// ─── Types (local extensions) ────────────────────────────────────────────────

interface ProjectDashboard {
  project: {
    id: string;
    name: string;
    logo: string;
    website: string;
    twitter: string;
    discord: string;
    chain: import('@/types').Chain;
    verified: boolean;
  };
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalEntries: number;
    verifiedParticipants: number;
    walletsCollected: number;
    completionRate: number;
  };
  campaigns: Array<
    Campaign & {
      participantCount: number;
      walletsCollected: number;
      pendingVerifications: number;
      completionRate: number;
    }
  >;
}

export type { ProjectDashboard };

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useProjectDashboard() {
  return useQuery<ProjectDashboard>({
    queryKey: ['project', 'dashboard'],
    queryFn: async () => {
      if (USE_MOCK) {
        return mockProjectDashboard;
      }
      try {
        const project = await api.get<{
          id: string;
          name: string;
          logoUrl?: string | null;
          website?: string | null;
          twitterHandle?: string | null;
          discordInvite?: string | null;
          isVerified: boolean;
        }>('/projects/me');
        const campaigns = await fetchProjectCampaigns();
        const activeCount = campaigns.filter((c) => c.status === 'active').length;
        return {
          project: {
            id: project.id,
            name: project.name,
            logo:
              project.logoUrl ??
              `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(project.id)}`,
            website: project.website ?? '',
            twitter: project.twitterHandle ?? '',
            discord: project.discordInvite ?? '',
            chain: (campaigns[0]?.chain as Chain) ?? 'ETH',
            verified: project.isVerified,
          },
          stats: {
            totalCampaigns: campaigns.length,
            activeCampaigns: activeCount,
            totalEntries: campaigns.reduce((s, c) => s + (c.participantCount ?? 0), 0),
            verifiedParticipants: 0,
            walletsCollected: 0,
            completionRate: 0,
          },
          campaigns: campaigns.map((c) => ({
            ...c,
            participantCount: c.participantCount ?? 0,
            walletsCollected: 0,
            pendingVerifications: 0,
            completionRate: 0,
          })),
        };
      } catch {
        return mockProjectDashboard;
      }
    },
    staleTime: 30_000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: import('@/types').CreateCampaignInput) => {
      if (USE_MOCK) {
        const mock: Campaign = {
          id: `cam-${Date.now()}`,
          name: input.name,
          description: input.description,
          projectName: 'Phantom Protocol',
          projectLogo:
            'https://api.dicebear.com/8.x/shapes/svg?seed=phantom&backgroundColor=FF5C00',
          bannerImage: input.bannerImage ?? '',
          chain: input.chain,
          rewardType: input.rewardType,
          status: 'draft',
          taskCount: input.tasks.length,
          participantCount: 0,
          pointsAvailable: input.tasks.reduce((s, t) => s + t.points, 0),
          startDate: input.startDate,
          endDate: input.endDate,
          createdAt: new Date().toISOString(),
        };
        return mock;
      }
      try {
        const created = await api.post<unknown>(
          '/projects/me/campaigns',
          buildCreateCampaignBody(input),
        );
        return mapApiCampaignDetail(created as ApiCampaignRow & { tasks?: unknown[] });
      } catch {
        const mock: Campaign = {
          id: `cam-${Date.now()}`,
          name: input.name,
          description: input.description,
          projectName: 'Phantom Protocol',
          projectLogo:
            'https://api.dicebear.com/8.x/shapes/svg?seed=phantom&backgroundColor=FF5C00',
          bannerImage: input.bannerImage ?? '',
          chain: input.chain,
          rewardType: input.rewardType,
          status: 'draft',
          taskCount: input.tasks.length,
          participantCount: 0,
          pointsAvailable: input.tasks.reduce((s, t) => s + t.points, 0),
          startDate: input.startDate,
          endDate: input.endDate,
          createdAt: new Date().toISOString(),
        };
        return mock;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', 'dashboard'] });
    },
  });
}

export function useParticipants(campaignId: string) {
  return useQuery<Participant[]>({
    queryKey: ['participants', campaignId],
    queryFn: async () => {
      try {
        return await fetchParticipants(campaignId);
      } catch {
        return mockParticipants;
      }
    },
    staleTime: 20_000,
  });
}

export function useUpdateParticipantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      userId,
      status,
    }: {
      campaignId: string;
      userId: string;
      status: 'eligible' | 'ineligible';
      note?: string;
    }) => {
      try {
        return await api.patch(
          `/projects/me/campaigns/${campaignId}/participants/${userId}/whitelist`,
          { whitelisted: status === 'eligible' },
        );
      } catch {
        return { userId, status };
      }
    },
    onMutate: async ({ campaignId, userId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['participants', campaignId] });
      const previous = queryClient.getQueryData<Participant[]>(['participants', campaignId]);

      queryClient.setQueryData<Participant[]>(['participants', campaignId], (old) =>
        old
          ? old.map((p) => (p.userId === userId ? { ...p, status } : p))
          : old,
      );

      return { previous };
    },
    onError: (_err, { campaignId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['participants', campaignId], context.previous);
      }
    },
    onSettled: (_data, _err, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['participants', campaignId] });
    },
  });
}

export function useExportData(campaignId: string) {
  return useQuery<Participant[]>({
    queryKey: ['export', campaignId],
    queryFn: async () => {
      if (USE_MOCK) {
        return mockParticipants;
      }
      try {
        const res = await api.get<{ format: string; content: unknown }>(
          `/projects/me/campaigns/${campaignId}/export?format=json`,
        );
        if (Array.isArray(res.content)) {
          return res.content as Participant[];
        }
        return mockParticipants;
      } catch {
        return mockParticipants;
      }
    },
    staleTime: 60_000,
  });
}

export function useRegisterProject() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      logo: string;
      website: string;
      twitter: string;
      discord: string;
      chain: import('@/types').Chain;
      category: string;
    }) => {
      try {
        return await api.post('/projects', {
          name: data.name,
          website: data.website,
          twitterHandle: data.twitter,
          discordInvite: data.discord,
        });
      } catch {
        return { id: `proj-${Date.now()}`, ...data };
      }
    },
  });
}
