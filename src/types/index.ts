export type Chain = 'ETH' | 'SOL' | 'BNB' | 'MATIC' | 'ARB' | 'BASE' | 'AVAX';
export type RewardType = 'airdrop' | 'whitelist' | 'both';
export type CampaignStatus = 'active' | 'ended' | 'draft';
export type TaskType =
  | 'twitter_follow'
  | 'twitter_retweet'
  | 'discord_join'
  | 'hold_token'
  | 'hold_nft'
  | 'submit_screenshot'
  | 'custom';
export type TaskStatus = 'locked' | 'available' | 'completed' | 'pending_verification';

/** Chains we can verify onchain task state for via viem. */
export type OnchainChain = 'ETH' | 'BASE' | 'ARB' | 'MATIC' | 'BNB' | 'AVAX';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  projectName: string;
  projectLogo: string;
  bannerImage: string;
  chain: Chain;
  rewardType: RewardType;
  status: CampaignStatus;
  taskCount: number;
  participantCount: number;
  maxParticipants?: number;
  pointsAvailable: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  tasks?: Task[];
}

export interface OnchainTaskConfig {
  /** Which chain the contract lives on. */
  chain: OnchainChain;
  /** Token / NFT contract address (0x...). */
  contractAddress: `0x${string}`;
  /**
   * Minimum balance the wallet must hold.
   * For ERC-20 this is a UI-unit amount (e.g. 100 = 100 USDC); the verifier
   * uses the on-chain `decimals()` to scale.
   * For ERC-721 this is the minimum NFT count.
   */
  minBalance: number;
  /** Optional human-readable label (e.g. "USDC", "Pudgy Penguins"). */
  symbol?: string;
}

export interface Task {
  id: string;
  campaignId: string;
  type: TaskType;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
  proofType: 'auto' | 'manual';
  proofUrl?: string;
  order: number;
  /** Present on `hold_token` and `hold_nft` tasks. */
  onchain?: OnchainTaskConfig;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  twitterHandle?: string;
  discordHandle?: string;
  walletAddress?: string;
  totalPoints: number;
  joinedCampaigns: number;
}

export interface WalletEntry {
  id: string;
  campaignId: string;
  userId: string;
  walletAddress: string;
  chain: Chain;
  submittedAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  walletSubmitted: boolean;
  walletAddress?: string;
  walletChain?: Chain;
  tasksCompleted: number;
  totalTasks: number;
  points: number;
  status: 'eligible' | 'ineligible';
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  points: number;
  tasksCompleted: number;
  isCurrentUser: boolean;
}

export interface Project {
  id: string;
  name: string;
  logo: string;
  description: string;
  website?: string;
  twitter?: string;
  discord?: string;
  ownerId: string;
  createdAt: string;
}

export interface DashboardData {
  user: User;
  campaigns: Campaign[];
  totalPoints: number;
  completedTasks: number;
  leaderboardRank?: number;
}

export interface CampaignFilters {
  chain?: Chain | 'ALL';
  rewardType?: RewardType | 'ALL';
  status?: CampaignStatus | 'ALL';
  search?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskSubmission {
  taskId: string;
  proof?: string;
  proofUrl?: string;
  proofText?: string;
  tweetUrl?: string;
  screenshotUrl?: string;
}

export interface WalletSubmission {
  campaignId: string;
  walletAddress: string;
  chain: Chain;
}

export interface DashboardQuestEntry {
  campaign: Campaign;
  tasksCompleted: number;
  totalTasks: number;
  pointsEarned: number;
  walletSubmitted: boolean;
  lastActivity: string;
}

export interface UserDashboard {
  user: User;
  joinedCampaigns: DashboardQuestEntry[];
  totalPoints: number;
  totalCampaigns: number;
  walletEntries: Array<{
    id: string;
    campaignId: string;
    chain: Chain;
    submittedAt: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    points?: number;
  }>;
}

export interface CreateCampaignTaskInput {
  title: string;
  description?: string;
  type: TaskType;
  points: number;
  proofType: 'auto' | 'manual';
  order?: number;
  isRequired?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateCampaignInput {
  name: string;
  description: string;
  bannerImage?: string;
  chain: Chain;
  rewardType: RewardType;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  tasks: CreateCampaignTaskInput[];
}
