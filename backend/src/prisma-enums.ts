/** Mirrors `prisma/schema.prisma` enums so the app compiles when `prisma generate` has not run yet. */

export enum RewardType {
  AIRDROP = 'AIRDROP',
  WHITELIST = 'WHITELIST',
  BOTH = 'BOTH',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export enum TaskType {
  TWITTER_FOLLOW = 'TWITTER_FOLLOW',
  TWITTER_RETWEET = 'TWITTER_RETWEET',
  DISCORD_JOIN = 'DISCORD_JOIN',
  TOKEN_HOLD = 'TOKEN_HOLD',
  MANUAL = 'MANUAL',
  SCREENSHOT = 'SCREENSHOT',
}

export enum ProofType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Chain {
  ETHEREUM = 'ETHEREUM',
  POLYGON = 'POLYGON',
  ARBITRUM = 'ARBITRUM',
  BASE = 'BASE',
  SOLANA = 'SOLANA',
  BSC = 'BSC',
  OTHER = 'OTHER',
}
