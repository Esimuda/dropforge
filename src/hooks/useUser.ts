'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, loadUserDashboardFromApi, USE_MOCK, submitWallet } from '@/lib/api';
import { mockUserDashboard } from '@/lib/mockData';
import type { UserDashboard, WalletEntry, Chain } from '@/types';
import { mapChainFromApi } from '@/lib/api-mappers';

export const userKeys = {
  all: ['user'] as const,
  dashboard: () => [...userKeys.all, 'dashboard'] as const,
  walletEntry: (campaignId: string) =>
    [...userKeys.all, 'walletEntry', campaignId] as const,
};

export function useUserDashboard() {
  return useQuery<UserDashboard>({
    queryKey: userKeys.dashboard(),
    queryFn: async (): Promise<UserDashboard> => {
      try {
        if (USE_MOCK) {
          return mockUserDashboard;
        }
        return await loadUserDashboardFromApi();
      } catch {
        return mockUserDashboard;
      }
    },
    staleTime: 30_000,
    retry: 1,
    placeholderData: mockUserDashboard,
  });
}

export function useWalletEntry(campaignId: string) {
  return useQuery<WalletEntry | null>({
    queryKey: userKeys.walletEntry(campaignId),
    queryFn: async (): Promise<WalletEntry | null> => {
      try {
        if (USE_MOCK) {
          return null;
        }
        const row = await api.get<{
          id: string;
          campaignId: string;
          chain: string;
          submittedAt: string;
          updatedAt: string;
        }>(`/wallet-entries/${campaignId}`);
        return {
          id: row.id,
          campaignId: row.campaignId,
          userId: '',
          walletAddress: '· · · ·',
          chain: mapChainFromApi(row.chain),
          submittedAt: row.submittedAt,
          updatedAt: row.updatedAt,
        };
      } catch {
        return null;
      }
    },
    enabled: Boolean(campaignId),
    staleTime: 60_000,
    retry: 1,
  });
}

interface SubmitWalletPayload {
  campaignId: string;
  walletAddress: string;
  chain: Chain;
}

export function useSubmitWallet() {
  const queryClient = useQueryClient();

  return useMutation<WalletEntry, Error, SubmitWalletPayload>({
    mutationFn: (payload: SubmitWalletPayload) => submitWallet(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.walletEntry(data.campaignId),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.dashboard() });
    },
  });
}

interface UpdateWalletPayload {
  campaignId: string;
  id: string;
  walletAddress: string;
  chain: Chain;
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();

  return useMutation<WalletEntry, Error, UpdateWalletPayload>({
    mutationFn: async (payload: UpdateWalletPayload): Promise<WalletEntry> => {
      return submitWallet({
        campaignId: payload.campaignId,
        walletAddress: payload.walletAddress,
        chain: payload.chain,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.walletEntry(data.campaignId),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.dashboard() });
    },
  });
}
