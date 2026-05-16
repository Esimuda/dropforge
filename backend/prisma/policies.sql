-- Dropforge — Supabase Row-Level Security policies
--
-- Run this AFTER the schema migration (0001_init.sql). It enables RLS on every
-- table and defines policies per the spec.
--
-- Assumes Supabase's `auth.uid()` returns the authenticated user's UUID and
-- that the application's User.id matches the Supabase auth user id (1:1
-- mapping). If you use a separate user table identifier, replace `auth.uid()`
-- in each policy with the appropriate lookup.

-- ─── Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE "User"                FORCE ROW LEVEL SECURITY;
ALTER TABLE "User"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletEntry"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhitelistSlot"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExportLog"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken"        ENABLE ROW LEVEL SECURITY;

-- ─── User ───────────────────────────────────────────────────────────────────
-- Users can read and update only their own row.

CREATE POLICY "user_select_self" ON "User"
  FOR SELECT USING ("id" = auth.uid());

CREATE POLICY "user_update_self" ON "User"
  FOR UPDATE USING ("id" = auth.uid())
  WITH CHECK ("id" = auth.uid());

-- ─── Project ────────────────────────────────────────────────────────────────
-- Anyone authenticated can read projects (needed to render campaign cards).
-- Only the owner can insert / update their own project.

CREATE POLICY "project_select_all" ON "Project"
  FOR SELECT USING (true);

CREATE POLICY "project_insert_owner" ON "Project"
  FOR INSERT WITH CHECK ("ownerId" = auth.uid());

CREATE POLICY "project_update_owner" ON "Project"
  FOR UPDATE USING ("ownerId" = auth.uid())
  WITH CHECK ("ownerId" = auth.uid());

-- ─── Campaign ───────────────────────────────────────────────────────────────
-- Anyone can read non-draft, non-deleted campaigns. Owners can read all their
-- own campaigns. Only the project owner can write.

CREATE POLICY "campaign_select_public" ON "Campaign"
  FOR SELECT USING (
    "deletedAt" IS NULL AND "status" IN ('ACTIVE', 'ENDED')
    OR EXISTS (
      SELECT 1 FROM "Project" p
       WHERE p."id" = "Campaign"."projectId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "campaign_insert_owner" ON "Campaign"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Project" p
       WHERE p."id" = "Campaign"."projectId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "campaign_update_owner" ON "Campaign"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Project" p
       WHERE p."id" = "Campaign"."projectId" AND p."ownerId" = auth.uid()
    )
  );

-- ─── Task ───────────────────────────────────────────────────────────────────

CREATE POLICY "task_select_all" ON "Task"
  FOR SELECT USING (true);

CREATE POLICY "task_insert_owner" ON "Task"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Campaign" c
        JOIN "Project" p ON p."id" = c."projectId"
       WHERE c."id" = "Task"."campaignId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "task_update_owner" ON "Task"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
        JOIN "Project" p ON p."id" = c."projectId"
       WHERE c."id" = "Task"."campaignId" AND p."ownerId" = auth.uid()
    )
  );

-- ─── CampaignParticipant ────────────────────────────────────────────────────
-- A user reads their own rows. A row can also be read for leaderboard purposes;
-- the application should restrict the projected columns at the query layer to
-- (id, userId, pointsEarned, rank) per spec.

CREATE POLICY "participant_select_self_or_leaderboard" ON "CampaignParticipant"
  FOR SELECT USING (true);

CREATE POLICY "participant_insert_self" ON "CampaignParticipant"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "participant_update_self" ON "CampaignParticipant"
  FOR UPDATE USING ("userId" = auth.uid());

-- ─── Submission ─────────────────────────────────────────────────────────────

CREATE POLICY "submission_select_self_or_owner" ON "Submission"
  FOR SELECT USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "Task" t
        JOIN "Campaign" c ON c."id" = t."campaignId"
        JOIN "Project" p  ON p."id" = c."projectId"
       WHERE t."id" = "Submission"."taskId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "submission_insert_self" ON "Submission"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "submission_update_owner_or_self_pending" ON "Submission"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Task" t
        JOIN "Campaign" c ON c."id" = t."campaignId"
        JOIN "Project" p  ON p."id" = c."projectId"
       WHERE t."id" = "Submission"."taskId" AND p."ownerId" = auth.uid()
    )
    OR ("userId" = auth.uid() AND "status" = 'PENDING')
  );

-- ─── WalletEntry ────────────────────────────────────────────────────────────
-- User reads/writes their own. Project owner reads (export only) — encryption
-- keeps the raw address safe even if a policy is misconfigured.

CREATE POLICY "wallet_select_self_or_owner" ON "WalletEntry"
  FOR SELECT USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "Campaign" c
        JOIN "Project" p ON p."id" = c."projectId"
       WHERE c."id" = "WalletEntry"."campaignId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "wallet_insert_self" ON "WalletEntry"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "wallet_update_self" ON "WalletEntry"
  FOR UPDATE USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- ─── WhitelistSlot ──────────────────────────────────────────────────────────

CREATE POLICY "whitelist_select_self_or_owner" ON "WhitelistSlot"
  FOR SELECT USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "Campaign" c
        JOIN "Project" p ON p."id" = c."projectId"
       WHERE c."id" = "WhitelistSlot"."campaignId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "whitelist_insert_owner" ON "WhitelistSlot"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Campaign" c
        JOIN "Project" p ON p."id" = c."projectId"
       WHERE c."id" = "WhitelistSlot"."campaignId" AND p."ownerId" = auth.uid()
    )
  );

CREATE POLICY "whitelist_update_owner" ON "WhitelistSlot"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
        JOIN "Project" p ON p."id" = c."projectId"
       WHERE c."id" = "WhitelistSlot"."campaignId" AND p."ownerId" = auth.uid()
    )
  );

-- ─── Notification ───────────────────────────────────────────────────────────

CREATE POLICY "notif_select_self" ON "Notification"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "notif_update_self" ON "Notification"
  FOR UPDATE USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- ─── ExportLog ──────────────────────────────────────────────────────────────

CREATE POLICY "exportlog_select_self" ON "ExportLog"
  FOR SELECT USING ("exportedBy" = auth.uid());

CREATE POLICY "exportlog_insert_self" ON "ExportLog"
  FOR INSERT WITH CHECK ("exportedBy" = auth.uid());

-- ─── RefreshToken ───────────────────────────────────────────────────────────
-- Server-side managed; deny direct client access.

CREATE POLICY "refresh_no_access" ON "RefreshToken"
  FOR ALL USING (false) WITH CHECK (false);
