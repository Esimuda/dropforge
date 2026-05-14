import { PrismaClient } from '@prisma/client';
import { Chain, RewardType, CampaignStatus, TaskType, ProofType } from '../src/prisma-enums';

const prisma = new PrismaClient();

async function main() {
  await prisma.exportLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.walletEntry.deleteMany();
  await prisma.campaignParticipant.deleteMany();
  await prisma.task.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      username: 'DropforgeDemo',
      twitterHandle: 'dropforge_demo',
      twitterId: 'seed_owner_twitter',
    },
  });

  const project = await prisma.project.create({
    data: {
      ownerId: owner.id,
      name: 'Nova Meme',
      website: 'https://example.com',
      twitterHandle: 'novameme',
      isVerified: true,
    },
  });

  const start = new Date(Date.now() - 86_400_000);
  const end = new Date(Date.now() + 86_400_000 * 30);

  const campaign = await prisma.campaign.create({
    data: {
      projectId: project.id,
      title: 'Genesis Quest',
      description: 'Complete tasks to earn points and airdrop eligibility.',
      bannerUrl: null,
      chain: Chain.BASE,
      rewardType: RewardType.BOTH,
      startDate: start,
      endDate: end,
      maxParticipants: 5000,
      status: CampaignStatus.ACTIVE,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        campaignId: campaign.id,
        title: 'Follow on Twitter',
        taskType: TaskType.TWITTER_FOLLOW,
        points: 50,
        proofType: ProofType.AUTO,
        metadata: { targetHandle: 'novameme' },
        order: 0,
        isRequired: true,
      },
      {
        campaignId: campaign.id,
        title: 'Join Discord',
        taskType: TaskType.DISCORD_JOIN,
        points: 75,
        proofType: ProofType.AUTO,
        metadata: { guildId: '000000000000000000' },
        order: 1,
        isRequired: true,
      },
      {
        campaignId: campaign.id,
        title: 'Upload proof',
        taskType: TaskType.SCREENSHOT,
        points: 100,
        proofType: ProofType.MANUAL,
        metadata: {},
        order: 2,
        isRequired: false,
      },
    ],
  });

  const player = await prisma.user.create({
    data: {
      username: 'PlayerOne',
      discordHandle: 'playerone',
      discordId: 'seed_player_discord',
    },
  });

  await prisma.campaignParticipant.create({
    data: { campaignId: campaign.id, userId: player.id, pointsEarned: 10 },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete.', { ownerId: owner.id, campaignId: campaign.id, playerId: player.id });
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
