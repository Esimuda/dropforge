-- Dropforge — initial schema migration
-- Generated to match `prisma/schema.prisma` exactly. Apply this manually to a
-- Postgres database that is not managed by `prisma migrate` (e.g. Supabase via
-- the SQL editor). For Prisma-managed dev workflows, run `prisma migrate dev`
-- and the migration runner will produce its own SQL — this file is a static
-- reference / portable migration.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "RewardType" AS ENUM ('AIRDROP', 'WHITELIST', 'BOTH');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "TaskType" AS ENUM (
  'TWITTER_FOLLOW',
  'TWITTER_RETWEET',
  'DISCORD_JOIN',
  'TOKEN_HOLD',
  'NFT_HOLD',
  'SCREENSHOT',
  'MANUAL'
);
CREATE TYPE "ProofType" AS ENUM ('AUTO', 'MANUAL');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "WhitelistStatus" AS ENUM ('GRANTED', 'REVOKED');

-- ─── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         TEXT         UNIQUE,
  "username"      TEXT         UNIQUE,
  "avatarUrl"     TEXT,
  "twitterHandle" TEXT         UNIQUE,
  "twitterId"     TEXT         UNIQUE,
  "discordHandle" TEXT,
  "discordId"     TEXT         UNIQUE,
  "walletAddress" TEXT         UNIQUE,
  "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "deletedAt"     TIMESTAMPTZ
);

CREATE TABLE "RefreshToken" (
  "id"        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID         NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "jti"       TEXT         NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ  NOT NULL,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

CREATE TABLE "Project" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"      UUID         NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "name"          TEXT         NOT NULL,
  "logoUrl"       TEXT,
  "bannerUrl"     TEXT,
  "website"       TEXT,
  "twitterHandle" TEXT,
  "discordInvite" TEXT,
  "description"   TEXT,
  "isVerified"    BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "deletedAt"     TIMESTAMPTZ
);

CREATE TABLE "Campaign" (
  "id"              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId"       UUID             NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "title"           TEXT             NOT NULL,
  "description"     TEXT             NOT NULL,
  "bannerUrl"       TEXT,
  "chain"           TEXT             NOT NULL,
  "rewardType"      "RewardType"     NOT NULL,
  "status"          "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate"       TIMESTAMPTZ      NOT NULL,
  "endDate"         TIMESTAMPTZ      NOT NULL,
  "maxParticipants" INT,
  "totalPoints"     INT              NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  "deletedAt"       TIMESTAMPTZ
);
CREATE INDEX "Campaign_projectId_idx"                    ON "Campaign"("projectId");
CREATE INDEX "Campaign_status_endDate_idx"               ON "Campaign"("status", "endDate");
CREATE INDEX "Campaign_chain_idx"                        ON "Campaign"("chain");
CREATE INDEX "Campaign_status_chain_rewardType_idx"      ON "Campaign"("status", "chain", "rewardType");
CREATE INDEX "Campaign_deletedAt_idx"                    ON "Campaign"("deletedAt");
-- Full-text-friendly index on title for search.
CREATE INDEX "Campaign_title_trgm_idx" ON "Campaign" USING gin ("title" gin_trgm_ops);

CREATE TABLE "Task" (
  "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId"  UUID         NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "title"       TEXT         NOT NULL,
  "description" TEXT,
  "taskType"    "TaskType"   NOT NULL,
  "proofType"   "ProofType"  NOT NULL,
  "points"      INT          NOT NULL DEFAULT 0,
  "isRequired"  BOOLEAN      NOT NULL DEFAULT true,
  "order"       INT          NOT NULL DEFAULT 0,
  "metadata"    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "Task_campaignId_idx" ON "Task"("campaignId");

CREATE TABLE "CampaignParticipant" (
  "id"             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId"     UUID         NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "userId"         UUID         NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "pointsEarned"   INT          NOT NULL DEFAULT 0,
  "tasksCompleted" INT          NOT NULL DEFAULT 0,
  "isEligible"     BOOLEAN      NOT NULL DEFAULT false,
  "joinedAt"       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "CampaignParticipant_campaignId_userId_key" ON "CampaignParticipant"("campaignId", "userId");
CREATE INDEX "CampaignParticipant_campaignId_idx"               ON "CampaignParticipant"("campaignId");
CREATE INDEX "CampaignParticipant_userId_idx"                   ON "CampaignParticipant"("userId");
CREATE INDEX "CampaignParticipant_leaderboard_idx"              ON "CampaignParticipant"("campaignId", "pointsEarned" DESC);

CREATE TABLE "Submission" (
  "id"            UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId"        UUID                NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE,
  "userId"        UUID                NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "campaignId"    UUID                NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "proofUrl"      TEXT,
  "proofText"     TEXT,
  "tweetUrl"      TEXT,
  "screenshotUrl" TEXT,
  "status"        "SubmissionStatus"  NOT NULL DEFAULT 'PENDING',
  "reviewNote"    TEXT,
  "submittedAt"   TIMESTAMPTZ         NOT NULL DEFAULT now(),
  "reviewedAt"    TIMESTAMPTZ
);
CREATE UNIQUE INDEX "Submission_taskId_userId_key" ON "Submission"("taskId", "userId");
CREATE INDEX "Submission_status_idx"               ON "Submission"("status");
CREATE INDEX "Submission_taskId_status_idx"        ON "Submission"("taskId", "status");
CREATE INDEX "Submission_campaignId_idx"           ON "Submission"("campaignId");

CREATE TABLE "WalletEntry" (
  "id"                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId"             UUID         NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "userId"                 UUID         NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "encryptedWalletAddress" TEXT         NOT NULL,
  "iv"                     TEXT         NOT NULL,
  "chain"                  TEXT         NOT NULL,
  "submittedAt"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"              TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "WalletEntry_campaignId_userId_key" ON "WalletEntry"("campaignId", "userId");
CREATE INDEX "WalletEntry_userId_idx"                   ON "WalletEntry"("userId");

CREATE TABLE "WhitelistSlot" (
  "id"         UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID               NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "userId"     UUID               NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "grantedBy"  UUID               NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "grantedAt"  TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "status"     "WhitelistStatus"  NOT NULL DEFAULT 'GRANTED'
);
CREATE UNIQUE INDEX "WhitelistSlot_campaignId_userId_key" ON "WhitelistSlot"("campaignId", "userId");
CREATE INDEX "WhitelistSlot_campaignId_idx"               ON "WhitelistSlot"("campaignId");
CREATE INDEX "WhitelistSlot_userId_idx"                   ON "WhitelistSlot"("userId");

CREATE TABLE "Notification" (
  "id"                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"             UUID         NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"               TEXT         NOT NULL,
  "message"            TEXT         NOT NULL,
  "isRead"             BOOLEAN      NOT NULL DEFAULT false,
  "relatedCampaignId"  UUID         REFERENCES "Campaign"("id") ON DELETE SET NULL,
  "relatedTaskId"      UUID,
  "createdAt"          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

CREATE TABLE "ExportLog" (
  "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId"  UUID         NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "exportedBy"  UUID         NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "format"      TEXT         NOT NULL,
  "filters"     JSONB        NOT NULL,
  "recordCount" INT          NOT NULL DEFAULT 0,
  "exportedAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "ExportLog_campaignId_idx"  ON "ExportLog"("campaignId");
CREATE INDEX "ExportLog_exportedBy_idx"  ON "ExportLog"("exportedBy");

-- ─── Triggers: maintain updatedAt ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_set_updated_at        BEFORE UPDATE ON "User"        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER project_set_updated_at     BEFORE UPDATE ON "Project"     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER campaign_set_updated_at    BEFORE UPDATE ON "Campaign"    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER walletentry_set_updated_at BEFORE UPDATE ON "WalletEntry" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── pg_cron job: auto-end campaigns past endDate ──────────────────────────
-- Requires the `pg_cron` extension (available on Supabase). Skip if not enabled.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'dropforge-end-campaigns',
      '*/5 * * * *',
      $cron$
        UPDATE "Campaign"
           SET "status" = 'ENDED'
         WHERE "status" = 'ACTIVE'
           AND "endDate" <= now();
      $cron$
    );
  END IF;
END;
$$;
