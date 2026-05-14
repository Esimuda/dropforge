import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { ExportService, ExportFilters } from './export.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
} from './dto/campaign.dto';
import { CampaignStatus, SubmissionStatus } from '../prisma-enums';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { HttpStatus } from '@nestjs/common';
import { buildPaginated } from '../common/dto/pagination-query.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly exportService: ExportService,
  ) {}

  private async getVerifiedProject(ownerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { ownerId },
    });
    if (!project || !project.isVerified) {
      throw new AppHttpException(
        ErrorCodes.FORBIDDEN,
        'Only verified project owners can access this resource.',
        HttpStatus.FORBIDDEN,
      );
    }
    return project;
  }

  async registerProject(
    ownerId: string,
    dto: CreateProjectDto,
    logoBuffer?: Buffer,
  ) {
    const existing = await this.prisma.project.findUnique({ where: { ownerId } });
    if (existing) {
      throw new AppHttpException(
        ErrorCodes.CONFLICT,
        'You already have a registered project.',
        HttpStatus.CONFLICT,
      );
    }
    let logoUrl: string | null = null;
    if (logoBuffer?.length) {
      logoUrl = await this.cloudinary.uploadBuffer(
        logoBuffer,
        'projects/logos',
        `${ownerId}-${Date.now()}`,
      );
    }
    const project = await this.prisma.project.create({
      data: {
        ownerId,
        name: dto.name,
        logoUrl,
        website: dto.website,
        twitterHandle: dto.twitterHandle,
        discordInvite: dto.discordInvite,
        isVerified: false,
      },
    });
    return project;
  }

  async getMyProject(ownerId: string) {
    const project = await this.getVerifiedProject(ownerId);
    return project;
  }

  async updateMyProject(
    ownerId: string,
    dto: UpdateProjectDto,
    logoBuffer?: Buffer,
  ) {
    const project = await this.getVerifiedProject(ownerId);
    let logoUrl = project.logoUrl;
    if (logoBuffer?.length) {
      const uploaded = await this.cloudinary.uploadBuffer(
        logoBuffer,
        'projects/logos',
        `${ownerId}-${Date.now()}`,
      );
      if (uploaded) {
        logoUrl = uploaded;
      }
    }
    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: dto.name ?? project.name,
        website: dto.website ?? project.website,
        twitterHandle: dto.twitterHandle ?? project.twitterHandle,
        discordInvite: dto.discordInvite ?? project.discordInvite,
        logoUrl,
      },
    });
  }

  private async assertCampaign(projectId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, projectId, deletedAt: null },
    });
    if (!campaign) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Campaign not found', HttpStatus.NOT_FOUND);
    }
    return campaign;
  }

  private canEditCampaign(c: { status: CampaignStatus; startDate: Date }) {
    const now = new Date();
    if (c.status === CampaignStatus.DRAFT) {
      return true;
    }
    if (c.status === CampaignStatus.ACTIVE && now < c.startDate) {
      return true;
    }
    return false;
  }

  async listMyCampaigns(ownerId: string, page: number, limit: number) {
    const project = await this.getVerifiedProject(ownerId);
    const skip = (page - 1) * limit;
    const where = { projectId: project.id, deletedAt: null as Date | null };
    const [rows, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);
    type CampaignRow = (typeof rows)[number];
    return buildPaginated(
      rows.map((c: CampaignRow) => ({
        ...c,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        createdAt: c.createdAt.toISOString(),
        deletedAt: c.deletedAt?.toISOString() ?? null,
      })),
      total,
      page,
      limit,
    );
  }

  async createCampaign(ownerId: string, dto: CreateCampaignDto) {
    const project = await this.getVerifiedProject(ownerId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'endDate must be after startDate',
        HttpStatus.BAD_REQUEST,
      );
    }
    const tasks = dto.tasks ?? [];
    return this.prisma.$transaction(async (tx: any) => {
      const campaign = await tx.campaign.create({
        data: {
          projectId: project.id,
          title: dto.title,
          description: dto.description,
          chain: dto.chain,
          rewardType: dto.rewardType,
          startDate: start,
          endDate: end,
          maxParticipants: dto.maxParticipants,
          status: CampaignStatus.DRAFT,
        },
      });
      if (tasks.length) {
        await tx.task.createMany({
          data: tasks.map((t, i) => ({
            campaignId: campaign.id,
            title: t.title,
            description: t.description,
            taskType: t.taskType,
            points: t.points,
            proofType: t.proofType,
            metadata: (t.metadata ?? {}) as object,
            order: t.order ?? i,
            isRequired: t.isRequired ?? true,
          })),
        });
      }
      return tx.campaign.findUnique({
        where: { id: campaign.id },
        include: { tasks: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async updateCampaign(ownerId: string, campaignId: string, dto: UpdateCampaignDto) {
    const project = await this.getVerifiedProject(ownerId);
    const campaign = await this.assertCampaign(project.id, campaignId);
    if (!this.canEditCampaign(campaign)) {
      throw new AppHttpException(
        ErrorCodes.FORBIDDEN,
        'Campaign can only be edited while draft or before it has started.',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        title: dto.title,
        description: dto.description,
        chain: dto.chain,
        rewardType: dto.rewardType,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        maxParticipants: dto.maxParticipants,
        status: dto.status,
      },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteCampaign(ownerId: string, campaignId: string) {
    const project = await this.getVerifiedProject(ownerId);
    const campaign = await this.assertCampaign(project.id, campaignId);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new AppHttpException(
        ErrorCodes.FORBIDDEN,
        'Only draft campaigns can be deleted.',
        HttpStatus.FORBIDDEN,
      );
    }
    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async publishCampaign(ownerId: string, campaignId: string) {
    const project = await this.getVerifiedProject(ownerId);
    const campaign = await this.assertCampaign(project.id, campaignId);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'Only draft campaigns can be published.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const taskCount = await this.prisma.task.count({ where: { campaignId: campaign.id } });
    if (!taskCount) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'Add at least one task before publishing.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const now = new Date();
    if (campaign.endDate <= now) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'Cannot publish a campaign that already ended.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.ACTIVE },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async listParticipants(ownerId: string, campaignId: string, page: number, limit: number) {
    const project = await this.getVerifiedProject(ownerId);
    await this.assertCampaign(project.id, campaignId);
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.campaignParticipant.findMany({
        where: { campaignId },
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
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
    const withStats = await Promise.all(
      rows.map(async (r: (typeof rows)[number]) => {
        const subs = await this.prisma.submission.findMany({
          where: {
            campaignId,
            userId: r.userId,
            status: SubmissionStatus.APPROVED,
          },
          distinct: ['taskId'],
          select: { taskId: true },
        });
        const tasksCompleted = subs.length;
        const hasWallet = await this.prisma.walletEntry.findUnique({
          where: { campaignId_userId: { campaignId, userId: r.userId } },
        });
        return {
          ...r,
          joinedAt: r.joinedAt.toISOString(),
          user: r.user,
          stats: {
            tasksCompleted,
            hasWallet: Boolean(hasWallet),
          },
        };
      }),
    );
    return buildPaginated(withStats, total, page, limit);
  }

  async exportCampaign(
    ownerId: string,
    campaignId: string,
    format: 'json' | 'csv',
    filters: ExportFilters,
  ) {
    const project = await this.getVerifiedProject(ownerId);
    await this.assertCampaign(project.id, campaignId);
    if (format === 'csv') {
      const csv = await this.exportService.generateCsv(campaignId, filters, ownerId);
      return { format: 'csv', content: csv };
    }
    const rows = await this.exportService.generateJson(campaignId, filters, ownerId);
    return { format: 'json', content: rows };
  }

  async setWhitelist(
    ownerId: string,
    campaignId: string,
    userId: string,
    whitelisted: boolean,
  ) {
    const project = await this.getVerifiedProject(ownerId);
    await this.assertCampaign(project.id, campaignId);
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (!participant) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Participant not found', HttpStatus.NOT_FOUND);
    }
    return this.prisma.campaignParticipant.update({
      where: { id: participant.id },
      data: { isWhitelisted: whitelisted },
    });
  }
}
