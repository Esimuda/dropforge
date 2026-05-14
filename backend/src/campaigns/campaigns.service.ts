import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignListQueryDto } from './dto/campaign-list-query.dto';
import { CampaignStatus, SubmissionStatus } from '../prisma-enums';
import { buildPaginated } from '../common/dto/pagination-query.dto';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(q: CampaignListQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where = {
      deletedAt: null,
      status: q.status ?? CampaignStatus.ACTIVE,
      ...(q.chain ? { chain: q.chain } : {}),
      ...(q.rewardType ? { rewardType: q.rewardType } : {}),
    };
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
        include: {
          project: { select: { id: true, name: true, logoUrl: true, isVerified: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    type CampaignListItem = (typeof rows)[number];
    return buildPaginated(
      rows.map((c: CampaignListItem) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        bannerUrl: c.bannerUrl,
        chain: c.chain,
        rewardType: c.rewardType,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        status: c.status,
        maxParticipants: c.maxParticipants,
        project: c.project,
      })),
      total,
      page,
      limit,
    );
  }

  async detail(id: string, userId?: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, logoUrl: true, twitterHandle: true } },
        tasks: { orderBy: { order: 'asc' } },
      },
    });
    if (!campaign) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Campaign not found', HttpStatus.NOT_FOUND);
    }
    let taskStatuses: Record<string, { submissionStatus?: SubmissionStatus }> = {};
    if (userId) {
      const submissions = await this.prisma.submission.findMany({
        where: { userId, campaignId: id },
        select: { taskId: true, status: true },
        orderBy: { submittedAt: 'desc' },
      });
      const latest = new Map<string, SubmissionStatus>();
      for (const s of submissions) {
        if (!latest.has(s.taskId)) {
          latest.set(s.taskId, s.status);
        }
      }
      taskStatuses = Object.fromEntries(
        [...latest.entries()].map(([taskId, status]) => [taskId, { submissionStatus: status }]),
      );
    }
    return {
      ...this.serializeCampaign(campaign),
      tasks: campaign.tasks.map((t: (typeof campaign.tasks)[number]) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        points: t.points,
        proofType: t.proofType,
        metadata: t.metadata,
        order: t.order,
        isRequired: t.isRequired,
        userStatus: taskStatuses[t.id] ?? {},
      })),
    };
  }

  private serializeCampaign(c: {
    id: string;
    title: string;
    description: string | null;
    bannerUrl: string | null;
    chain: string;
    rewardType: string;
    startDate: Date;
    endDate: Date;
    status: string;
    maxParticipants: number | null;
    project: unknown;
  }) {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      bannerUrl: c.bannerUrl,
      chain: c.chain,
      rewardType: c.rewardType,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      status: c.status,
      maxParticipants: c.maxParticipants,
      project: c.project,
    };
  }

  async join(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, deletedAt: null },
    });
    if (!campaign) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Campaign not found', HttpStatus.NOT_FOUND);
    }
    const now = new Date();
    if (now > campaign.endDate || campaign.status === CampaignStatus.ENDED) {
      throw new AppHttpException(
        ErrorCodes.CAMPAIGN_ENDED,
        'This campaign has already ended.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new AppHttpException(
        ErrorCodes.TASK_LOCKED,
        'This campaign is not active yet.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (now < campaign.startDate) {
      throw new AppHttpException(
        ErrorCodes.TASK_LOCKED,
        'This campaign has not started yet.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (campaign.maxParticipants) {
      const count = await this.prisma.campaignParticipant.count({
        where: { campaignId },
      });
      if (count >= campaign.maxParticipants) {
        throw new AppHttpException(
          ErrorCodes.CONFLICT,
          'Campaign is full.',
          HttpStatus.CONFLICT,
        );
      }
    }
    const existing = await this.prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (existing) {
      throw new AppHttpException(
        ErrorCodes.ALREADY_JOINED,
        'You have already joined this campaign.',
        HttpStatus.CONFLICT,
      );
    }
    const participant = await this.prisma.campaignParticipant.create({
      data: { campaignId, userId },
    });
    return {
      id: participant.id,
      campaignId: participant.campaignId,
      joinedAt: participant.joinedAt.toISOString(),
    };
  }

  async leaderboard(campaignId: string, page: number, limit: number) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, deletedAt: null },
    });
    if (!campaign) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Campaign not found', HttpStatus.NOT_FOUND);
    }
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.campaignParticipant.findMany({
        where: { campaignId },
        orderBy: { pointsEarned: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              twitterHandle: true,
              discordHandle: true,
            },
          },
        },
      }),
      this.prisma.campaignParticipant.count({ where: { campaignId } }),
    ]);
    type LeaderRow = (typeof rows)[number];
    return buildPaginated(
      rows.map((r: LeaderRow, idx: number) => ({
        rank: skip + idx + 1,
        userId: r.userId,
        pointsEarned: r.pointsEarned,
        joinedAt: r.joinedAt.toISOString(),
        user: r.user,
      })),
      total,
      page,
      limit,
    );
  }
}
