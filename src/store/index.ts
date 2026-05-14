import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chain, RewardType, CampaignStatus } from '@/types';

interface Filters {
  chain: Chain | 'ALL';
  rewardType: RewardType | 'ALL';
  status: CampaignStatus | 'ALL';
  search: string;
}

interface AppStore {
  // Campaign filters
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  clearFilters: () => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Optimistic task updates
  pendingTasks: string[];
  completedTasks: string[];
  addPendingTask: (taskId: string) => void;
  resolveTask: (taskId: string, success: boolean) => void;

  // Joined campaigns (optimistic)
  joinedCampaigns: string[];
  addJoinedCampaign: (campaignId: string) => void;
}

const defaultFilters: Filters = {
  chain: 'ALL',
  rewardType: 'ALL',
  status: 'ALL',
  search: '',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,

      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      clearFilters: () => set({ filters: defaultFilters }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      pendingTasks: [],
      completedTasks: [],

      addPendingTask: (taskId) =>
        set((state) => ({
          pendingTasks: [...state.pendingTasks.filter((id) => id !== taskId), taskId],
        })),

      resolveTask: (taskId, success) =>
        set((state) => ({
          pendingTasks: state.pendingTasks.filter((id) => id !== taskId),
          completedTasks: success
            ? [...state.completedTasks, taskId]
            : state.completedTasks,
        })),

      joinedCampaigns: [],
      addJoinedCampaign: (campaignId) =>
        set((state) => ({
          joinedCampaigns: state.joinedCampaigns.includes(campaignId)
            ? state.joinedCampaigns
            : [...state.joinedCampaigns, campaignId],
        })),
    }),
    {
      name: 'dropforge-store',
      partialize: (state) => ({
        joinedCampaigns: state.joinedCampaigns,
        completedTasks: state.completedTasks,
      }),
    }
  )
);
