import type {
  Campaign,
  Task,
  User,
  LeaderboardEntry,
  Participant,
  UserDashboard,
} from '@/types';

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Genesis Airdrop Season 1',
    description:
      'Join the genesis airdrop campaign for EtherVault Protocol. Complete quests, hold tokens, and secure your spot in the largest DeFi airdrop of 2024. Early participants receive multiplied rewards.',
    projectName: 'EtherVault',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=ethervault&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80',
    chain: 'ETH',
    rewardType: 'airdrop',
    status: 'active',
    taskCount: 6,
    participantCount: 24389,
    maxParticipants: 50000,
    pointsAvailable: 1500,
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2026-06-15T23:59:59Z',
    createdAt: '2024-02-28T10:00:00Z',
  },
  {
    id: 'camp-002',
    name: 'SolanaStorm Whitelist',
    description:
      'Get whitelisted for SolanaStorm NFT mint. Complete social tasks, join our community and prove your loyalty to the Solana ecosystem.',
    projectName: 'SolanaStorm',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=solanastorm&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=1200&q=80',
    chain: 'SOL',
    rewardType: 'whitelist',
    status: 'active',
    taskCount: 4,
    participantCount: 8920,
    maxParticipants: 10000,
    pointsAvailable: 800,
    startDate: '2024-03-05T00:00:00Z',
    endDate: '2026-05-30T23:59:59Z',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'camp-003',
    name: 'ArbitrumDEX Launch Rewards',
    description:
      'Celebrate the launch of ArbitrumDEX with our community rewards program. Trade, provide liquidity, and complete quests to earn ARB tokens.',
    projectName: 'ArbitrumDEX',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=arbitrumdex&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1200&q=80',
    chain: 'ARB',
    rewardType: 'both',
    status: 'active',
    taskCount: 8,
    participantCount: 15670,
    maxParticipants: 25000,
    pointsAvailable: 2500,
    startDate: '2024-02-15T00:00:00Z',
    endDate: '2026-07-01T23:59:59Z',
    createdAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'camp-004',
    name: 'BaseWorld Early Access',
    description:
      'Be among the first to experience BaseWorld — the next generation Web3 social platform built on Base. Complete tasks to earn exclusive early access and token rewards.',
    projectName: 'BaseWorld',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=baseworld&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=1200&q=80',
    chain: 'BASE',
    rewardType: 'whitelist',
    status: 'active',
    taskCount: 5,
    participantCount: 11240,
    pointsAvailable: 1000,
    startDate: '2024-03-10T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    createdAt: '2024-03-08T10:00:00Z',
  },
  {
    id: 'camp-005',
    name: 'AvalancheDAO Governance',
    description:
      'Participate in AvalancheDAO governance and earn AVAX rewards. Vote on proposals, complete educational tasks, and become a core community member.',
    projectName: 'AvalancheDAO',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=avalanchedao&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1643114761829-f2f5a95a3c77?w=1200&q=80',
    chain: 'AVAX',
    rewardType: 'airdrop',
    status: 'ended',
    taskCount: 7,
    participantCount: 32100,
    maxParticipants: 30000,
    pointsAvailable: 3000,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-03-01T23:59:59Z',
    createdAt: '2023-12-28T10:00:00Z',
  },
  {
    id: 'camp-006',
    name: 'PolygonFi Liquidity Mining',
    description:
      'Provide liquidity on PolygonFi and earn MATIC rewards plus exclusive NFTs. The more you contribute, the more you earn.',
    projectName: 'PolygonFi',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=polygonfi&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1639803938107-38e4e40f5d54?w=1200&q=80',
    chain: 'MATIC',
    rewardType: 'both',
    status: 'active',
    taskCount: 5,
    participantCount: 7890,
    pointsAvailable: 1200,
    startDate: '2024-03-12T00:00:00Z',
    endDate: '2026-08-15T23:59:59Z',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'camp-007',
    name: 'BNB Chain Quest Series',
    description:
      'Complete a series of DeFi quests on BNB Chain to earn BNB rewards and exclusive NFTs. Learn, earn, and grow with the BNB ecosystem.',
    projectName: 'BNBQuest',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=bnbquest&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1638913662529-1d2f1eb5b526?w=1200&q=80',
    chain: 'BNB',
    rewardType: 'airdrop',
    status: 'active',
    taskCount: 9,
    participantCount: 19450,
    maxParticipants: 40000,
    pointsAvailable: 2000,
    startDate: '2024-03-08T00:00:00Z',
    endDate: '2026-09-01T23:59:59Z',
    createdAt: '2024-03-05T10:00:00Z',
  },
  {
    id: 'camp-008',
    name: 'SolanaNFT Collector Pass',
    description:
      'Collect SOL NFTs from top artists and earn whitelist spots across 5 different NFT collections. The ultimate NFT collector quest.',
    projectName: 'SolArt',
    projectLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=solart&backgroundColor=1A1A1A',
    bannerImage: 'https://images.unsplash.com/photo-1646463485175-21b4e0f1e9c5?w=1200&q=80',
    chain: 'SOL',
    rewardType: 'whitelist',
    status: 'ended',
    taskCount: 6,
    participantCount: 14200,
    pointsAvailable: 900,
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-02-28T23:59:59Z',
    createdAt: '2024-01-10T10:00:00Z',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-001',
    campaignId: 'camp-001',
    type: 'twitter_follow',
    title: 'Follow @EtherVault on Twitter',
    description: 'Follow the official EtherVault Twitter account to stay updated on protocol news.',
    points: 100,
    status: 'completed',
    proofType: 'auto',
    order: 1,
  },
  {
    id: 'task-002',
    campaignId: 'camp-001',
    type: 'twitter_retweet',
    title: 'Retweet the Genesis Announcement',
    description: 'Retweet our genesis airdrop announcement to spread the word.',
    points: 150,
    status: 'completed',
    proofType: 'auto',
    order: 2,
  },
  {
    id: 'task-003',
    campaignId: 'camp-001',
    type: 'discord_join',
    title: 'Join the EtherVault Discord',
    description: 'Join our Discord community and verify your account in #verify channel.',
    points: 200,
    status: 'available',
    proofType: 'auto',
    order: 3,
  },
  {
    id: 'task-004',
    campaignId: 'camp-001',
    type: 'hold_token',
    title: 'Hold 100 EVT Tokens',
    description: 'Hold at least 100 EVT tokens in your connected wallet for minimum 7 days.',
    points: 500,
    status: 'available',
    proofType: 'auto',
    order: 4,
  },
  {
    id: 'task-005',
    campaignId: 'camp-001',
    type: 'submit_screenshot',
    title: 'Submit Liquidity Proof',
    description: 'Provide liquidity to ETH/EVT pool and submit a screenshot of your position.',
    points: 350,
    status: 'locked',
    proofType: 'manual',
    order: 5,
  },
  {
    id: 'task-006',
    campaignId: 'camp-001',
    type: 'custom',
    title: 'Complete KYC Verification',
    description: 'Complete identity verification to qualify for the maximum airdrop tier.',
    points: 200,
    status: 'locked',
    proofType: 'manual',
    order: 6,
  },
];

export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'cryptowhale.eth',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptowhale',
    twitterHandle: '@cryptowhale',
    discordHandle: 'cryptowhale#1234',
    walletAddress: '0x1234...5678',
    totalPoints: 24500,
    joinedCampaigns: 12,
  },
  {
    id: 'user-002',
    username: 'defi_hunter',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=defihunter',
    twitterHandle: '@defi_hunter',
    discordHandle: 'defi_hunter#5678',
    walletAddress: '0xabcd...efgh',
    totalPoints: 18200,
    joinedCampaigns: 8,
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user-003',
    username: 'satoshi_returns',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=satoshi',
    points: 48750,
    tasksCompleted: 94,
    isCurrentUser: false,
  },
  {
    rank: 2,
    userId: 'user-004',
    username: 'vitalik_fan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vitalikfan',
    points: 42100,
    tasksCompleted: 87,
    isCurrentUser: false,
  },
  {
    rank: 3,
    userId: 'user-005',
    username: 'moon_chaser',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moonchaser',
    points: 38900,
    tasksCompleted: 81,
    isCurrentUser: false,
  },
  {
    rank: 4,
    userId: 'user-001',
    username: 'cryptowhale.eth',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptowhale',
    points: 24500,
    tasksCompleted: 52,
    isCurrentUser: true,
  },
];

export const mockParticipants: Participant[] = [
  {
    id: 'part-001',
    userId: 'user-001',
    username: 'cryptowhale.eth',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptowhale',
    walletSubmitted: true,
    walletAddress: '0x1234...5678',
    walletChain: 'ETH',
    tasksCompleted: 4,
    totalTasks: 6,
    points: 950,
    status: 'eligible',
    joinedAt: '2024-03-02T10:00:00Z',
  },
  {
    id: 'part-002',
    userId: 'user-002',
    username: 'defi_hunter',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=defihunter',
    walletSubmitted: false,
    tasksCompleted: 2,
    totalTasks: 6,
    points: 250,
    status: 'ineligible',
    joinedAt: '2024-03-03T14:30:00Z',
  },
];

export function getMockCampaign(id: string): Campaign | undefined {
  const campaign = mockCampaigns.find((c) => c.id === id);
  if (!campaign) return undefined;
  return {
    ...campaign,
    tasks: mockTasks.filter((t) => t.campaignId === id),
  };
}

export function getMockCampaigns(filters?: {
  chain?: string;
  rewardType?: string;
  status?: string;
  search?: string;
}): Campaign[] {
  let results = [...mockCampaigns];

  if (filters?.chain && filters.chain !== 'ALL') {
    results = results.filter((c) => c.chain === filters.chain);
  }
  if (filters?.rewardType && filters.rewardType !== 'ALL') {
    results = results.filter((c) => c.rewardType === filters.rewardType);
  }
  if (filters?.status && filters.status !== 'ALL') {
    results = results.filter((c) => c.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }

  return results;
}

export const mockUserDashboard: UserDashboard = {
  user: {
    id: 'user-001',
    username: 'cryptowhale.eth',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptowhale',
    twitterHandle: '@cryptowhale',
    discordHandle: 'cryptowhale#1234',
    walletAddress: '0x1234…5678',
    totalPoints: 24500,
    joinedCampaigns: 2,
  },
  joinedCampaigns: [
    {
      campaign: mockCampaigns[0],
      tasksCompleted: 4,
      totalTasks: 6,
      pointsEarned: 950,
      walletSubmitted: true,
      lastActivity: '2024-03-02T10:00:00Z',
    },
    {
      campaign: mockCampaigns[1],
      tasksCompleted: 2,
      totalTasks: 4,
      pointsEarned: 320,
      walletSubmitted: false,
      lastActivity: '2024-03-03T14:30:00Z',
    },
  ],
  totalPoints: 24500,
  totalCampaigns: 2,
  walletEntries: [
    {
      id: 'we-1',
      campaignId: 'camp-001',
      chain: 'ETH',
      submittedAt: '2024-03-02T10:00:00Z',
    },
  ],
  recentActivity: [
    {
      type: 'task_completed',
      description: 'Completed Twitter follow for Genesis Airdrop',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      points: 50,
    },
    {
      type: 'campaign_joined',
      description: 'Joined SolanaStorm Whitelist',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};
