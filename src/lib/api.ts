import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import type {
  Campaign,
  CampaignFilters,
  Participant,
  Task,
  TaskSubmission,
  UserDashboard,
  WalletEntry,
  WalletSubmission,
} from '@/types';
import {
  getMockCampaign,
  getMockCampaigns,
  mockParticipants,
  mockTasks,
  mockUserDashboard,
} from '@/lib/mockData';
import {
  extractPagedRows,
  listQueryParams,
  mapApiCampaignDetail,
  mapApiCampaignListItem,
  mapApiParticipantRow,
  mapChainFromApi,
  mapChainToApi,
  mapRewardFromApi,
  mapStatusFromApi,
  type ApiCampaignRow,
} from '@/lib/api-mappers';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Use mock data only when explicitly enabled. */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

function unwrapPayload<T>(raw: unknown): T {
  if (
    raw &&
    typeof raw === 'object' &&
    'success' in raw &&
    (raw as { success?: boolean }).success === true &&
    'data' in raw
  ) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  client.interceptors.request.use(async (config) => {
    try {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch {
      // ignore
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      response.data = unwrapPayload(response.data);
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const body = error.response?.data;
      const msg =
        (body && typeof body === 'object' && 'error' in body
          ? (body as { error?: { message?: string } }).error?.message
          : undefined) ||
        (typeof body?.message === 'string' ? body.message : undefined) ||
        error.message ||
        'An unexpected error occurred';
      return Promise.reject(new Error(`${status ? `${status}: ` : ''}${msg}`));
    },
  );

  return client;
}

export const apiClient = createApiClient();

/** Typed helpers returning unwrapped `data` from `{ success, data }`. */
export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.get<T>(url, config);
    return res.data as T;
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.post<T>(url, body, config);
    return res.data as T;
  },
  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.patch<T>(url, body, config);
    return res.data as T;
  },
  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.put<T>(url, body, config);
    return res.data as T;
  },
};

async function apiPost<T>(endpoint: string, data: unknown, mockFn: () => T): Promise<T> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return mockFn();
  }
  return api.post<T>(endpoint, data);
}

export async function fetchCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return getMockCampaigns({
      chain: filters?.chain,
      rewardType: filters?.rewardType,
      status: filters?.status,
      search: filters?.search,
    });
  }
  const rows = await api.get<unknown>('/campaigns', { params: listQueryParams(filters) });
  const list = extractPagedRows<ApiCampaignRow>(rows);
  return list.map(mapApiCampaignListItem);
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    const campaign = getMockCampaign(id);
    if (!campaign) throw new Error(`404: Campaign not found`);
    return campaign;
  }
  const raw = await api.get<unknown>(`/campaigns/${id}`);
  return mapApiCampaignDetail(raw as ApiCampaignRow & { tasks?: unknown[] });
}

export async function joinCampaign(campaignId: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
    return { success: true };
  }
  await api.post(`/campaigns/${campaignId}/join`, {});
  return { success: true };
}

export async function submitTask(submission: TaskSubmission): Promise<Task> {
  const body = {
    proofUrl: submission.proofUrl,
    proofText: submission.proofText ?? submission.proof,
    tweetUrl: submission.tweetUrl,
    screenshotUrl: submission.screenshotUrl,
  };
  const task = mockTasks.find((t) => t.id === submission.taskId);
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    if (!task) throw new Error('404: Task not found');
    return { ...task, status: 'pending_verification' as const };
  }
  await api.post(`/tasks/${submission.taskId}/submit`, body);
  if (!task) throw new Error('404: Task not found');
  return {
    ...task,
    status: 'pending_verification' as const,
  };
}

export async function submitWallet(submission: WalletSubmission): Promise<WalletEntry> {
  const payload = {
    campaignId: submission.campaignId,
    walletAddress: submission.walletAddress,
    chain: mapChainToApi(submission.chain),
  };
  const raw = await apiPost<{
    id: string;
    campaignId: string;
    chain: string;
    submittedAt: string;
    updatedAt: string;
  }>('/wallet-entries', payload, () => ({
    id: `wallet-${Date.now()}`,
    campaignId: submission.campaignId,
    chain: mapChainToApi(submission.chain),
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  return {
    id: raw.id,
    campaignId: raw.campaignId,
    userId: '',
    walletAddress: submission.walletAddress,
    chain: mapChainFromApi(raw.chain),
    submittedAt: raw.submittedAt,
    updatedAt: raw.updatedAt,
  };
}

export async function fetchUserDashboard(): Promise<UserDashboard> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return mockUserDashboard;
  }
  return loadUserDashboardFromApi();
}

export async function fetchProjectCampaigns(): Promise<Campaign[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));
    return getMockCampaigns();
  }
  const raw = await api.get<unknown>('/projects/me/campaigns?page=1&limit=100');
  const rows = extractPagedRows<ApiCampaignRow>(raw);
  return rows.map(mapApiCampaignListItem);
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const mock = (): Campaign =>
    ({
      ...data,
      id: `camp-${Date.now()}`,
      name: data.name ?? 'Untitled',
      description: data.description ?? '',
      projectName: data.projectName ?? 'Project',
      projectLogo: data.projectLogo ?? '',
      bannerImage: data.bannerImage ?? '',
      chain: data.chain ?? 'ETH',
      rewardType: data.rewardType ?? 'airdrop',
      status: 'draft',
      taskCount: 0,
      participantCount: 0,
      pointsAvailable: 0,
      startDate: data.startDate ?? new Date().toISOString(),
      endDate: data.endDate ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }) as Campaign;

  if (USE_MOCK) {
    return mock();
  }
  const created = await api.post<unknown>('/projects/me/campaigns', {
    title: data.name,
    description: data.description,
    chain: data.chain ? mapChainToApi(data.chain) : 'BASE',
    rewardType: (data.rewardType ?? 'airdrop').toUpperCase(),
    startDate: data.startDate,
    endDate: data.endDate,
    maxParticipants: data.maxParticipants,
    tasks: [],
  });
  return mapApiCampaignDetail(created as ApiCampaignRow & { tasks?: unknown[] });
}

export async function fetchParticipants(campaignId: string): Promise<Participant[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return mockParticipants;
  }
  const raw = await api.get<unknown>(
    `/projects/me/campaigns/${campaignId}/participants?page=1&limit=200`,
  );
  const rows = extractPagedRows<Parameters<typeof mapApiParticipantRow>[0]>(raw);
  return rows.map((r) => mapApiParticipantRow(r, 6));
}

export async function loadUserDashboardFromApi(): Promise<UserDashboard> {
  if (USE_MOCK) {
    return mockUserDashboard;
  }
  const [profile, dash, walletRows] = await Promise.all([
    api.get<{
      id: string;
      username?: string | null;
      avatarUrl?: string | null;
      twitterHandle?: string | null;
      discordHandle?: string | null;
      walletLinked?: boolean;
    }>('/users/me'),
    api.get<{
      campaigns: Array<{
        campaignId: string;
        title: string;
        status: string;
        chain: string;
        rewardType: string;
        pointsEarned: number;
        joinedAt: string;
        endDate: string;
        walletSubmitted: boolean;
        walletChain?: string | null;
      }>;
    }>('/users/me/dashboard'),
    api
      .get<Array<{ id: string; campaignId: string; chain: string; submittedAt: string }>>(
        '/wallet-entries/me',
      )
      .catch(() => []),
  ]);

  const joinedCampaigns = dash.campaigns.map((c) => {
    const campaign: Campaign = {
      id: c.campaignId,
      name: c.title,
      description: '',
      projectName: 'Campaign',
      projectLogo: `https://api.dicebear.com/8.x/shapes/svg?seed=${c.campaignId}&backgroundColor=FF5C00`,
      bannerImage: '',
      chain: mapChainFromApi(c.chain),
      rewardType: mapRewardFromApi(c.rewardType),
      status: mapStatusFromApi(c.status),
      taskCount: 0,
      participantCount: 0,
      pointsAvailable: 0,
      startDate: c.joinedAt,
      endDate: c.endDate,
      createdAt: c.joinedAt,
    };
    return {
      campaign,
      tasksCompleted: 0,
      totalTasks: Math.max(1, 5),
      pointsEarned: c.pointsEarned,
      walletSubmitted: c.walletSubmitted,
      lastActivity: c.joinedAt,
    };
  });

  const totalPoints = joinedCampaigns.reduce((s, j) => s + j.pointsEarned, 0);

  return {
    user: {
      id: profile.id,
      username: profile.username ?? 'User',
      avatar:
        profile.avatarUrl ??
        `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(profile.id)}`,
      twitterHandle: profile.twitterHandle ?? undefined,
      discordHandle: profile.discordHandle ?? undefined,
      walletAddress: profile.walletLinked ? 'Linked' : undefined,
      totalPoints,
      joinedCampaigns: joinedCampaigns.length,
    },
    joinedCampaigns,
    totalPoints,
    totalCampaigns: joinedCampaigns.length,
    walletEntries: (walletRows ?? []).map((w) => ({
      id: w.id,
      campaignId: w.campaignId,
      chain: mapChainFromApi(w.chain),
      submittedAt: w.submittedAt,
    })),
    recentActivity: [],
  };
}
