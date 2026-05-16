import type {
  Campaign,
  CampaignFilters,
  CampaignStatus,
  Chain,
  CreateCampaignInput,
  LeaderboardEntry,
  Participant,
  RewardType,
  Task,
  TaskStatus,
  TaskType,
} from '@/types';

/** Backend list/detail campaign shape (subset). */
export type ApiCampaignRow = {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  chain: string;
  rewardType: string;
  status: string;
  maxParticipants?: number | null;
  startDate: string;
  endDate: string;
  createdAt?: string;
  project?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    isVerified?: boolean;
  };
};

export type ApiTaskRow = {
  id: string;
  campaignId?: string;
  title: string;
  description?: string | null;
  taskType: string;
  points: number;
  proofType: string;
  metadata?: unknown;
  order: number;
  isRequired?: boolean;
  userStatus?: { submissionStatus?: string };
};

// Backend stores chain as a free-form string using the same canonical values
// the frontend uses (ETH/SOL/BNB/MATIC/BASE/ARB/AVAX). Translation is a no-op,
// the helpers exist so legacy API rows ("ETHEREUM", "BSC", ...) still resolve.
const LEGACY_FROM_API: Record<string, Chain> = {
  ETHEREUM: 'ETH',
  POLYGON: 'MATIC',
  ARBITRUM: 'ARB',
  SOLANA: 'SOL',
  BSC: 'BNB',
  OTHER: 'ETH',
};

const VALID_CHAINS = new Set<Chain>(['ETH', 'SOL', 'BNB', 'MATIC', 'ARB', 'BASE', 'AVAX']);

export function mapChainFromApi(chain: string): Chain {
  if (VALID_CHAINS.has(chain as Chain)) return chain as Chain;
  return LEGACY_FROM_API[chain] ?? 'ETH';
}

export function mapChainToApi(chain: Chain): string {
  return chain;
}

export function mapRewardFromApi(r: string): RewardType {
  const x = r.toLowerCase();
  if (x === 'airdrop' || x === 'whitelist' || x === 'both') return x;
  return 'airdrop';
}

export function mapStatusFromApi(s: string): CampaignStatus {
  const x = s.toLowerCase();
  // CANCELLED collapses to "ended" in the UI — there's no separate cancelled state on the frontend.
  if (x === 'cancelled') return 'ended';
  if (x === 'active' || x === 'ended' || x === 'draft') return x;
  return 'active';
}

const TASK_FROM_API: Record<string, TaskType> = {
  TWITTER_FOLLOW: 'twitter_follow',
  TWITTER_RETWEET: 'twitter_retweet',
  DISCORD_JOIN: 'discord_join',
  TOKEN_HOLD: 'hold_token',
  NFT_HOLD: 'hold_nft',
  MANUAL: 'custom',
  SCREENSHOT: 'submit_screenshot',
};

function mapTaskStatusFromSubmission(st?: string): TaskStatus {
  switch (st) {
    case 'APPROVED':
      return 'completed';
    case 'PENDING':
      return 'pending_verification';
    case 'REJECTED':
      return 'available';
    default:
      return 'available';
  }
}

export function mapApiCampaignListItem(row: ApiCampaignRow): Campaign {
  const p = row.project;
  return {
    id: row.id,
    name: row.title,
    description: row.description ?? '',
    projectName: p?.name ?? 'Project',
    projectLogo:
      p?.logoUrl ??
      `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(row.id)}&backgroundColor=1A1A1A`,
    bannerImage: row.bannerUrl ?? '',
    chain: mapChainFromApi(row.chain),
    rewardType: mapRewardFromApi(row.rewardType),
    status: mapStatusFromApi(row.status),
    taskCount: 0,
    participantCount: 0,
    maxParticipants: row.maxParticipants ?? undefined,
    pointsAvailable: 0,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt ?? row.startDate,
  };
}

export function mapApiTask(row: ApiTaskRow, campaignId: string): Task {
  const submission = row.userStatus?.submissionStatus;
  return {
    id: row.id,
    campaignId: row.campaignId ?? campaignId,
    type: TASK_FROM_API[row.taskType] ?? 'custom',
    title: row.title,
    description: row.description ?? '',
    points: row.points,
    status: mapTaskStatusFromSubmission(submission),
    proofType: row.proofType === 'AUTO' ? 'auto' : 'manual',
    order: row.order,
  };
}

export function mapApiCampaignDetail(payload: ApiCampaignRow & { tasks?: ApiTaskRow[] }): Campaign {
  const base = mapApiCampaignListItem(payload);
  const tasks = (payload.tasks ?? []).map((t) => mapApiTask(t, base.id));
  const taskCount = tasks.length;
  const pointsAvailable = tasks.reduce((s, t) => s + t.points, 0);
  return {
    ...base,
    taskCount,
    participantCount: base.participantCount,
    pointsAvailable,
    tasks,
  };
}

export type PaginatedApi<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export function extractPagedRows<T>(body: unknown): T[] {
  if (body && typeof body === 'object' && 'data' in body && Array.isArray((body as PaginatedApi<T>).data)) {
    return (body as PaginatedApi<T>).data;
  }
  if (Array.isArray(body)) {
    return body as T[];
  }
  return [];
}

export function listQueryParams(filters?: CampaignFilters): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    page: 1,
    limit: 50,
  };
  if (filters?.chain && filters.chain !== 'ALL') {
    params.chain = mapChainToApi(filters.chain as Chain);
  }
  if (filters?.rewardType && filters.rewardType !== 'ALL') {
    params.rewardType = String(filters.rewardType).toUpperCase();
  }
  if (filters?.status && filters.status !== 'ALL') {
    params.status = String(filters.status).toUpperCase();
  }
  return params;
}

export function mapApiParticipantRow(
  row: {
    id: string;
    userId: string;
    pointsEarned: number;
    joinedAt: string;
    isEligible?: boolean;
    user?: {
      username?: string | null;
      avatarUrl?: string | null;
    };
    stats?: { tasksCompleted?: number; hasWallet?: boolean };
  },
  totalTasksFallback: number,
): Participant {
  return {
    id: row.id,
    userId: row.userId,
    username: row.user?.username ?? 'User',
    avatar:
      row.user?.avatarUrl ??
      `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(row.userId)}`,
    walletSubmitted: Boolean(row.stats?.hasWallet),
    tasksCompleted: row.stats?.tasksCompleted ?? 0,
    totalTasks: totalTasksFallback,
    points: row.pointsEarned,
    status: row.isEligible === false ? 'ineligible' : 'eligible',
    joinedAt: row.joinedAt,
  };
}

export function mapApiLeaderboardRow(
  row: {
    rank: number;
    userId: string;
    pointsEarned: number;
    user?: { username?: string | null; avatarUrl?: string | null };
  },
  currentUserId?: string,
): LeaderboardEntry {
  return {
    rank: row.rank,
    userId: row.userId,
    username: row.user?.username ?? 'User',
    avatar:
      row.user?.avatarUrl ??
      `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(row.userId)}`,
    points: row.pointsEarned,
    tasksCompleted: 0,
    isCurrentUser: Boolean(currentUserId && row.userId === currentUserId),
  };
}

const TASK_TO_API: Record<TaskType, string> = {
  twitter_follow: 'TWITTER_FOLLOW',
  twitter_retweet: 'TWITTER_RETWEET',
  discord_join: 'DISCORD_JOIN',
  hold_token: 'TOKEN_HOLD',
  hold_nft: 'NFT_HOLD',
  submit_screenshot: 'SCREENSHOT',
  custom: 'MANUAL',
};

export function buildCreateCampaignBody(input: CreateCampaignInput) {
  return {
    title: input.name,
    description: input.description,
    chain: mapChainToApi(input.chain),
    rewardType: input.rewardType.toUpperCase(),
    startDate: input.startDate,
    endDate: input.endDate,
    maxParticipants: input.maxParticipants,
    tasks: input.tasks.map((t, i) => ({
      title: t.title,
      description: t.description,
      taskType: TASK_TO_API[t.type] ?? 'MANUAL',
      points: t.points,
      proofType: t.proofType === 'auto' ? 'AUTO' : 'MANUAL',
      metadata: t.metadata ?? {},
      order: t.order ?? i,
      isRequired: t.isRequired ?? true,
    })),
  };
}
