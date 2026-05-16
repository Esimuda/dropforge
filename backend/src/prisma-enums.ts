// Mirrors `prisma/schema.prisma` enums so the app compiles before `prisma generate` runs.
// `Chain` is now a free-form string in the DB (spec) — the constants below are the
// canonical accepted values, enforced at the application layer.

export enum RewardType {
  AIRDROP = 'AIRDROP',
  WHITELIST = 'WHITELIST',
  BOTH = 'BOTH',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum TaskType {
  TWITTER_FOLLOW = 'TWITTER_FOLLOW',
  TWITTER_RETWEET = 'TWITTER_RETWEET',
  DISCORD_JOIN = 'DISCORD_JOIN',
  TOKEN_HOLD = 'TOKEN_HOLD',
  NFT_HOLD = 'NFT_HOLD',
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

export enum WhitelistStatus {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
}

export const CHAIN_VALUES = [
  'ETH',
  'BASE',
  'ARB',
  'MATIC',
  'BNB',
  'AVAX',
  'SOL',
  'OTHER',
] as const;
export type Chain = (typeof CHAIN_VALUES)[number];

export function isChain(v: string | null | undefined): v is Chain {
  return !!v && (CHAIN_VALUES as readonly string[]).includes(v);
}
