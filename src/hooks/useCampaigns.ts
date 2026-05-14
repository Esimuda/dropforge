'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCampaigns, fetchCampaign, joinCampaign, submitTask } from '@/lib/api';
import { useAppStore } from '@/store';
import type { CampaignFilters, TaskSubmission } from '@/types';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: campaignKeys.list(filters ?? {}),
    queryFn: () => fetchCampaigns(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
}

export function useJoinCampaign() {
  const qc = useQueryClient();
  const addJoinedCampaign = useAppStore((s) => s.addJoinedCampaign);

  return useMutation({
    mutationFn: (campaignId: string) => joinCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      addJoinedCampaign(campaignId);
      qc.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
    },
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  const addPendingTask = useAppStore((s) => s.addPendingTask);
  const resolveTask = useAppStore((s) => s.resolveTask);

  return useMutation({
    mutationFn: (submission: TaskSubmission) => submitTask(submission),
    onMutate: ({ taskId }) => {
      addPendingTask(taskId);
    },
    onSuccess: (updatedTask, { taskId }) => {
      resolveTask(taskId, updatedTask.status === 'pending_verification' || updatedTask.status === 'completed');
      qc.invalidateQueries({ queryKey: campaignKeys.details() });
    },
    onError: (_, { taskId }) => {
      resolveTask(taskId, false);
    },
  });
}

// Hook using store filters
export function useFilteredCampaigns() {
  const filters = useAppStore((s) => s.filters);
  return useCampaigns(filters);
}
