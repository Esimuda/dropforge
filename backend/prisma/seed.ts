/**
 * Dropforge dev seed.
 *
 * Generates a representative snapshot per the spec:
 *   - 3 verified projects
 *   - 2 campaigns per project (one ACTIVE, one DRAFT)
 *   - 4–6 tasks per campaign (mixed types)
 *   - 50 user accounts
 *   - 30 of those users joined ≥1 campaign with varied points and submissions
 *   - 20 wallet entries spread across campaigns
 *   - 10 whitelist slots granted
 *   - Sample notifications
 */

import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import {
  CampaignStatus,
  ProofType,
  RewardType,
  SubmissionStatus,
  TaskType,
  WhitelistStatus,
  CHAIN_VALUES,
} from '../src/prisma-enums';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function encryptForSeed(plain: string): { encryptedWalletAddress: string; iv: string } {
  const raw = process.env.WALLET_ENCRYPTION_KEY || 'seed-dev-key';
  const key =
    raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)
      ? Buffer.from(raw, 'hex')
      : scryptSync(raw, 'dropforge-wallet-salt', 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedWalletAddress: `${enc.toString('base64')}.${tag.toString('base64')}`,
    iv: iv.toString('base64'),
  };
}

function evmAddr(seed: string): string {
  // Deterministic-ish 40-hex string from seed. Not a real checksummed address.
  const hex = Buffer.from(seed.padEnd(20, 'x')).toString('hex').slice(0, 40);
  return `0x${hex}`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Resetting tables…');
  await prisma.exportLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.whitelistSlot.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.walletEntry.deleteMany();
  await prisma.campaignParticipant.deleteMany();
  await prisma.task.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── 3 project owners + their projects ─────────────────────────────────────
  const projectSeeds = [
    {
      ownerName: 'NovaTeam',
      handle: 'novameme',
      projectName: 'Nova Meme',
      description: 'A community-driven memecoin building a new on-chain culture.',
      chain: 'BASE',
    },
    {
      ownerName: 'ApexLabs',
      handle: 'apexlabs',
      projectName: 'Apex Apes NFT',
      description: 'A 10k generative NFT collection with onchain utility.',
      chain: 'ETH',
    },
    {
      ownerName: 'SolForge',
      handle: 'solforge',
      projectName: 'SolForge',
      description: 'Solana-native airdrop infrastructure for emerging projects.',
      chain: 'SOL',
    },
  ] as const;

  const owners = await Promise.all(
    projectSeeds.map((p, i) =>
      prisma.user.create({
        data: {
          username: p.ownerName,
          twitterHandle: p.handle,
          twitterId: `seed_owner_${i}`,
          avatarUrl: `https://api.dicebear.com/8.x/shapes/svg?seed=${p.handle}&backgroundColor=1A1A1A`,
        },
      }),
    ),
  );

  const projects = await Promise.all(
    projectSeeds.map((p, i) =>
      prisma.project.create({
        data: {
          ownerId: owners[i].id,
          name: p.projectName,
          description: p.description,
          twitterHandle: p.handle,
          website: `https://${p.handle}.example`,
          isVerified: true,
          logoUrl: `https://api.dicebear.com/8.x/shapes/svg?seed=${p.handle}-logo&backgroundColor=FF5C00`,
        },
      }),
    ),
  );

  // ── 2 campaigns per project: 1 ACTIVE, 1 DRAFT ───────────────────────────
  const campaigns: { id: string; chain: string }[] = [];
  for (let i = 0; i < projectSeeds.length; i++) {
    const p = projectSeeds[i];
    const project = projects[i];
    const start = new Date(Date.now() - 86_400_000 * 3);
    const end = new Date(Date.now() + 86_400_000 * 30);

    const active = await prisma.campaign.create({
      data: {
        projectId: project.id,
        title: `${p.projectName} — Genesis Quest`,
        description: `Complete tasks to earn points toward the ${p.projectName} airdrop and whitelist.`,
        chain: p.chain,
        rewardType: RewardType.BOTH,
        startDate: start,
        endDate: end,
        maxParticipants: 5000,
        status: CampaignStatus.ACTIVE,
        bannerUrl: `https://api.dicebear.com/8.x/shapes/svg?seed=${p.handle}-banner`,
      },
    });

    const draft = await prisma.campaign.create({
      data: {
        projectId: project.id,
        title: `${p.projectName} — Phase 2 (Draft)`,
        description: 'Upcoming campaign — tasks being finalized.',
        chain: p.chain,
        rewardType: RewardType.AIRDROP,
        startDate: new Date(Date.now() + 86_400_000 * 14),
        endDate: new Date(Date.now() + 86_400_000 * 60),
        status: CampaignStatus.DRAFT,
      },
    });

    // Tasks for the ACTIVE campaign (4–6, mixed types).
    const taskCount = randInt(4, 6);
    const taskTypes: TaskType[] = [
      TaskType.TWITTER_FOLLOW,
      TaskType.DISCORD_JOIN,
      TaskType.TWITTER_RETWEET,
      TaskType.TOKEN_HOLD,
      TaskType.NFT_HOLD,
      TaskType.SCREENSHOT,
      TaskType.MANUAL,
    ];
    const chosen = shuffle(taskTypes).slice(0, taskCount);
    let totalPoints = 0;
    for (let t = 0; t < chosen.length; t++) {
      const type = chosen[t];
      const auto = type !== TaskType.SCREENSHOT && type !== TaskType.MANUAL;
      const points = randInt(25, 150);
      totalPoints += points;
      let metadata: Record<string, unknown> = {};
      if (type === TaskType.TWITTER_FOLLOW) metadata = { targetHandle: p.handle };
      else if (type === TaskType.TWITTER_RETWEET) metadata = { tweetId: '1234567890' };
      else if (type === TaskType.DISCORD_JOIN) metadata = { guildId: '987654321098765432' };
      else if (type === TaskType.TOKEN_HOLD || type === TaskType.NFT_HOLD) {
        metadata = {
          chain: p.chain,
          contractAddress: '0x' + 'a'.repeat(40),
          minAmount: type === TaskType.NFT_HOLD ? '1' : '1000',
        };
      }
      await prisma.task.create({
        data: {
          campaignId: active.id,
          title: humanizeTask(type, p.projectName),
          description: `Required task for ${p.projectName}.`,
          taskType: type,
          points,
          proofType: auto ? ProofType.AUTO : ProofType.MANUAL,
          metadata,
          order: t,
          isRequired: t < taskCount - 1,
        },
      });
    }
    await prisma.campaign.update({ where: { id: active.id }, data: { totalPoints } });

    // 2 draft tasks (no submissions against draft campaigns).
    await prisma.task.createMany({
      data: [
        {
          campaignId: draft.id,
          title: 'Placeholder task',
          taskType: TaskType.MANUAL,
          proofType: ProofType.MANUAL,
          points: 50,
          metadata: {},
          order: 0,
        },
      ],
    });

    campaigns.push({ id: active.id, chain: p.chain });
  }

  // ── 50 user accounts ─────────────────────────────────────────────────────
  const users: { id: string }[] = [];
  for (let i = 0; i < 50; i++) {
    const handle = `user_${i.toString().padStart(2, '0')}`;
    const u = await prisma.user.create({
      data: {
        username: handle,
        twitterHandle: handle,
        twitterId: `seed_user_${i}`,
        discordHandle: `${handle}#${randInt(1000, 9999)}`,
        discordId: `seed_discord_${i}`,
        walletAddress: evmAddr(`wallet_${i}_${Date.now()}`).slice(0, 42),
        avatarUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=${handle}`,
      },
    });
    users.push(u);
  }

  // ── 30 users participate in ≥1 campaign ─────────────────────────────────
  const participants = shuffle(users).slice(0, 30);
  const participantsByCampaign = new Map<string, string[]>();
  for (const c of campaigns) participantsByCampaign.set(c.id, []);

  for (const u of participants) {
    // Each chosen user joins 1–3 active campaigns.
    const joinCount = randInt(1, Math.min(3, campaigns.length));
    const joined = shuffle(campaigns).slice(0, joinCount);
    for (const c of joined) {
      const tasks = await prisma.task.findMany({ where: { campaignId: c.id } });
      let pointsEarned = 0;
      let tasksCompleted = 0;
      for (const t of tasks) {
        // ~60% chance the user submitted this task at all.
        if (Math.random() > 0.6) continue;
        const status: SubmissionStatus =
          Math.random() < 0.55
            ? SubmissionStatus.APPROVED
            : Math.random() < 0.6
              ? SubmissionStatus.PENDING
              : SubmissionStatus.REJECTED;
        await prisma.submission.create({
          data: {
            taskId: t.id,
            userId: u.id,
            campaignId: c.id,
            status,
            proofText: status === SubmissionStatus.APPROVED ? 'Auto-verified.' : null,
            reviewNote: status === SubmissionStatus.REJECTED ? 'Could not verify.' : null,
            reviewedAt: status !== SubmissionStatus.PENDING ? new Date() : null,
            submittedAt: new Date(Date.now() - randInt(0, 7) * 86_400_000),
          },
        });
        if (status === SubmissionStatus.APPROVED) {
          pointsEarned += t.points;
          tasksCompleted += 1;
        }
      }
      const required = tasks.filter((t) => t.isRequired);
      const approvedTaskIds = new Set(
        (
          await prisma.submission.findMany({
            where: { campaignId: c.id, userId: u.id, status: SubmissionStatus.APPROVED },
            select: { taskId: true },
          })
        ).map((s) => s.taskId),
      );
      const isEligible =
        required.length > 0 && required.every((t) => approvedTaskIds.has(t.id));
      await prisma.campaignParticipant.create({
        data: {
          campaignId: c.id,
          userId: u.id,
          pointsEarned,
          tasksCompleted,
          isEligible,
          joinedAt: new Date(Date.now() - randInt(1, 14) * 86_400_000),
        },
      });
      participantsByCampaign.get(c.id)!.push(u.id);
    }
  }

  // ── 20 wallet entries spread across campaigns ───────────────────────────
  let walletsWritten = 0;
  for (const [campaignId, uids] of participantsByCampaign.entries()) {
    if (walletsWritten >= 20) break;
    const campaign = campaigns.find((c) => c.id === campaignId)!;
    const chain = campaign.chain;
    const sample = shuffle(uids).slice(0, Math.min(uids.length, 7));
    for (const userId of sample) {
      if (walletsWritten >= 20) break;
      const plain =
        chain === 'SOL'
          ? // Pseudo-base58 (just for seed; not a real Solana address)
            Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14)
          : evmAddr(`wallet_seed_${userId}_${campaignId}`).slice(0, 42);
      const enc = encryptForSeed(plain);
      await prisma.walletEntry.create({
        data: {
          campaignId,
          userId,
          encryptedWalletAddress: enc.encryptedWalletAddress,
          iv: enc.iv,
          chain,
        },
      });
      walletsWritten += 1;
    }
  }

  // ── 10 whitelist slots ──────────────────────────────────────────────────
  let slotsWritten = 0;
  for (const c of campaigns) {
    if (slotsWritten >= 10) break;
    const uids = participantsByCampaign.get(c.id) ?? [];
    const eligible = await prisma.campaignParticipant.findMany({
      where: { campaignId: c.id, userId: { in: uids }, isEligible: true },
      select: { userId: true },
    });
    const project = projects[campaigns.indexOf(c)] ?? projects[0];
    const owner = owners[campaigns.indexOf(c)] ?? owners[0];
    for (const e of shuffle(eligible.map((r) => r.userId)).slice(0, 4)) {
      if (slotsWritten >= 10) break;
      await prisma.whitelistSlot.create({
        data: {
          campaignId: c.id,
          userId: e,
          grantedBy: owner.id,
          status: WhitelistStatus.GRANTED,
        },
      });
      await prisma.notification.create({
        data: {
          userId: e,
          type: 'WHITELIST_GRANTED',
          message: `You were granted a whitelist slot by ${project.name}.`,
          relatedCampaignId: c.id,
        },
      });
      slotsWritten += 1;
    }
  }

  // ── Misc notifications for variety ───────────────────────────────────────
  const recentSubs = await prisma.submission.findMany({
    where: { status: SubmissionStatus.APPROVED },
    include: { task: true },
    take: 15,
  });
  for (const s of recentSubs) {
    await prisma.notification.create({
      data: {
        userId: s.userId,
        type: 'TASK_APPROVED',
        message: `Your submission for "${s.task.title}" was approved (+${s.task.points} points).`,
        relatedCampaignId: s.campaignId,
        relatedTaskId: s.taskId,
      },
    });
  }

  console.log('Seed complete.', {
    owners: owners.length,
    projects: projects.length,
    campaigns: campaigns.length,
    users: users.length,
    walletsWritten,
    slotsWritten,
    chains: CHAIN_VALUES,
  });
}

function humanizeTask(type: TaskType, name: string): string {
  switch (type) {
    case TaskType.TWITTER_FOLLOW:
      return `Follow ${name} on X`;
    case TaskType.TWITTER_RETWEET:
      return `Retweet the ${name} launch tweet`;
    case TaskType.DISCORD_JOIN:
      return `Join the ${name} Discord`;
    case TaskType.TOKEN_HOLD:
      return `Hold ${name} tokens`;
    case TaskType.NFT_HOLD:
      return `Hold a ${name} NFT`;
    case TaskType.SCREENSHOT:
      return 'Submit a screenshot of your action';
    case TaskType.MANUAL:
      return `Custom: write a short ${name} review`;
    default:
      return 'Task';
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
