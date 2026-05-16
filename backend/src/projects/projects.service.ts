import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { ExportService, ExportFilters } from './export.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  SelectWhitelistDto,
  WhitelistMode,
} from './dto/campaign.dto';
import {
  CampaignStatus,
  SubmissionStatus,
  WhitelistStatus,
} from '../prisma-enums';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { buildPaginated } from '../common/dto/pagination-query.dto';
import { WalletCryptoService } from '../common/crypto/wallet-crypto.service';
import { MailService } from '../mail/mail.service';

const NEW_ACCOUNT_DAYS = 7;
const SPEED_RUN_MINUTES = 10;

type SuspiciousFlag = 'DUPLICATE_WALLET' | 'NEW_ACCOUNT' | 'SPEED_RUN';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly exportService: ExportService,
    private readonly walletCrypto: WalletCryptoService,
    private readonly mail: MailService,
  ) {}

  private async getVerifiedProject(ownerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { ownerId },
    });
    if (!project || !project.isVerified || project.deletedAt) {
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
    logoFile?: Express.Multer.File,
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
    if (logoFile?.buffer?.length) {
      logoUrl = await this.cloudinary.uploadImageFile(
        logoFile,
        'projects/logos',
        `${ownerId}-${Date.now()}`,
      );
    }
    const project = await this.prisma.project.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
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
    return this.getVerifiedProject(ownerId);
  }

  async updateMyProject(
    ownerId: string,
    dto: UpdateProjectDto,
    logoFile?: Express.Multer.File,
  ) {
    const project = await this.getVerifiedProject(ownerId);
    let logoUrl = project.logoUrl;
    if (logoFile?.buffer?.length) {
      const uploaded = await this.cloudinary.uploadImageFile(
        logoFile,
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
        description: dto.description ?? project.description,
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
    const totalPoints = tasks.reduce((sum, t) => sum + (t.points ?? 0), 0);
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
          totalPoints,
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
    const tasks = await this.prisma.task.findMany({
      where: { campaignId: campaign.id },
      select: { points: true },
    });
    if (!tasks.length) {
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
    const totalPoints = tasks.reduce((s: number, t: { points: number }) => s + t.points, 0);
    return this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.ACTIVE, totalPoints },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async listParticipants(ownerId: string, campaignId: string, page: number, limit: number) {
    const project = await this.getVerifiedProject(ownerId);
    const campaign = await this.assertCampaign(project.id, campaignId);
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
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.campaignParticipant.count({ where: { campaignId } }),
    ]);
    const userIds = rows.map((r: (typeof rows)[number]) => r.userId);
    const [allWallets, slots, approvedCounts, submissionSpan] = await Promise.all([
      this.prisma.walletEntry.findMany({
        where: { campaignId },
        select: { userId: true, encryptedWalletAddress: true, iv: true },
      }),
      this.prisma.whitelistSlot.findMany({
        where: { campaignId, userId: { in: userIds }, status: WhitelistStatus.GRANTED },
        select: { userId: true },
      }),
      this.prisma.submission.groupBy({
        by: ['userId'],
        where: { campaignId, userId: { in: userIds }, status: SubmissionStatus.APPROVED },
        _count: { taskId: true },
      }),
      this.prisma.submission.groupBy({
        by: ['userId'],
        where: { campaignId, userId: { in: userIds } },
        _min: { submittedAt: true },
        _max: { submittedAt: true },
        _count: { _all: true },
      }),
    ]);

    type WalletRow = { userId: string; encryptedWalletAddress: string; iv: string };
    const duplicateWalletUsers = this.findDuplicateWalletUsers(allWallets as WalletRow[]);
    const walletSet = new Set(
      (allWallets as WalletRow[])
        .filter((w) => userIds.includes(w.userId))
        .map((w) => w.userId),
    );
    const slotSet = new Set(slots.map((s: { userId: string }) => s.userId));
    const completedMap = new Map<string, number>(
      approvedCounts.map((a: { userId: string; _count: { taskId: number } }) => [
        a.userId,
        a._count.taskId,
      ]),
    );
    type Span = { min: Date | null; max: Date | null; count: number };
    const submissionMap = new Map<string, Span>(
      submissionSpan.map((s: any) => [
        s.userId as string,
        {
          min: s._min.submittedAt as Date | null,
          max: s._max.submittedAt as Date | null,
          count: s._count._all as number,
        },
      ]),
    );

    const totalTasks = await this.prisma.task.count({ where: { campaignId } });
    const campaignStart = campaign.startDate;
    const newAccountCutoff = new Date(
      campaignStart.getTime() - NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000,
    );

    return buildPaginated(
      rows.map((r: (typeof rows)[number]) => {
        const flags: SuspiciousFlag[] = [];
        if (duplicateWalletUsers.has(r.userId)) {
          flags.push('DUPLICATE_WALLET');
        }
        if (r.user.createdAt && r.user.createdAt > newAccountCutoff) {
          flags.push('NEW_ACCOUNT');
        }
        const span = submissionMap.get(r.userId);
        if (
          span &&
          span.min &&
          span.max &&
          span.count >= totalTasks &&
          totalTasks > 0 &&
          span.max.getTime() - r.joinedAt.getTime() <= SPEED_RUN_MINUTES * 60 * 1000
        ) {
          flags.push('SPEED_RUN');
        }
        return {
          id: r.id,
          userId: r.userId,
          pointsEarned: r.pointsEarned,
          tasksCompleted: r.tasksCompleted || completedMap.get(r.userId) || 0,
          isEligible: r.isEligible,
          isWhitelisted: slotSet.has(r.userId),
          joinedAt: r.joinedAt.toISOString(),
          user: {
            id: r.user.id,
            username: r.user.username,
            avatarUrl: r.user.avatarUrl,
            twitterHandle: r.user.twitterHandle,
            discordHandle: r.user.discordHandle,
          },
          suspiciousFlags: flags,
          stats: {
            tasksCompleted: r.tasksCompleted || completedMap.get(r.userId) || 0,
            hasWallet: walletSet.has(r.userId),
          },
        };
      }),
      total,
      page,
      limit,
    );
  }

  private findDuplicateWalletUsers(
    rows: { userId: string; encryptedWalletAddress: string; iv: string }[],
  ): Set<string> {
    const byAddress = new Map<string, string[]>();
    for (const w of rows) {
      let plain: string | null = null;
      try {
        plain = this.walletCrypto.decrypt({
          encryptedWalletAddress: w.encryptedWalletAddress,
          iv: w.iv,
        });
      } catch {
        plain = null;
      }
      if (!plain) {
        continue;
      }
      const key = plain.toLowerCase();
      const list = byAddress.get(key) ?? [];
      list.push(w.userId);
      byAddress.set(key, list);
    }
    const flagged = new Set<string>();
    for (const list of byAddress.values()) {
      if (list.length > 1) {
        for (const id of list) {
          flagged.add(id);
        }
      }
    }
    return flagged;
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
    const campaign = await this.assertCampaign(project.id, campaignId);
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
      include: { user: { select: { email: true, username: true } } },
    });
    if (!participant) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Participant not found', HttpStatus.NOT_FOUND);
    }
    const existing = await this.prisma.whitelistSlot.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    const desired = whitelisted ? WhitelistStatus.GRANTED : WhitelistStatus.REVOKED;
    const slot = existing
      ? await this.prisma.whitelistSlot.update({
          where: { id: existing.id },
          data: { status: desired, grantedBy: project.ownerId, grantedAt: new Date() },
        })
      : await this.prisma.whitelistSlot.create({
          data: { campaignId, userId, grantedBy: project.ownerId, status: desired },
        });
    if (whitelisted) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'WHITELIST_GRANTED',
          message: 'You have been granted a whitelist slot.',
          relatedCampaignId: campaignId,
        },
      });
      if (participant.user.email) {
        await this.mail.sendWhitelistGranted(participant.user.email, {
          username: participant.user.username,
          campaignTitle: campaign.title,
        });
      }
    }
    return {
      id: slot.id,
      userId,
      campaignId,
      status: slot.status,
      grantedAt: slot.grantedAt.toISOString(),
    };
  }

  async selectWhitelist(
    ownerId: string,
    campaignId: string,
    dto: SelectWhitelistDto,
  ) {
    const project = await this.getVerifiedProject(ownerId);
    const campaign = await this.assertCampaign(project.id, campaignId);
    const count = Math.max(1, Math.floor(dto.count));
    const filters = dto.filters ?? {};

    type ParticipantRow = {
      userId: string;
      pointsEarned: number;
      user: { id: string; email: string | null; username: string | null };
    };
    const participants = (await this.prisma.campaignParticipant.findMany({
      where: { campaignId },
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
    })) as ParticipantRow[];
    const userIds = participants.map((p) => p.userId);
    const [wallets, requiredTasks, approvedSubs] = await Promise.all([
      this.prisma.walletEntry.findMany({
        where: { campaignId },
        select: { userId: true },
      }),
      this.prisma.task.findMany({
        where: { campaignId, isRequired: true },
        select: { id: true },
      }),
      this.prisma.submission.findMany({
        where: {
          campaignId,
          userId: { in: userIds },
          status: SubmissionStatus.APPROVED,
        },
        select: { userId: true, taskId: true },
        distinct: ['userId', 'taskId'],
      }),
    ]);
    const walletSet = new Set((wallets as { userId: string }[]).map((w) => w.userId));
    const requiredIds = (requiredTasks as { id: string }[]).map((t) => t.id);
    const approvedByUser = new Map<string, Set<string>>();
    for (const s of approvedSubs as { userId: string; taskId: string }[]) {
      const set = approvedByUser.get(s.userId) ?? new Set<string>();
      set.add(s.taskId);
      approvedByUser.set(s.userId, set);
    }

    let pool = participants.filter((p) => {
      if (filters.hasWallet && !walletSet.has(p.userId)) {
        return false;
      }
      if (filters.minPoints != null && p.pointsEarned < filters.minPoints) {
        return false;
      }
      if (filters.completedRequired) {
        const approvedSet = approvedByUser.get(p.userId) ?? new Set<string>();
        if (!requiredIds.every((id: string) => approvedSet.has(id))) {
          return false;
        }
      }
      return true;
    });

    let selected: ParticipantRow[] = [];
    const mode = dto.mode;
    if (mode === WhitelistMode.TOP_PERFORMERS) {
      pool.sort((a, b) => b.pointsEarned - a.pointsEarned);
      selected = pool.slice(0, count);
    } else if (mode === WhitelistMode.RANDOM) {
      selected = this.shuffle(pool).slice(0, count);
    } else {
      const top = [...pool].sort((a, b) => b.pointsEarned - a.pointsEarned);
      const half = Math.floor(count / 2);
      const topPicks = top.slice(0, half);
      const topIds = new Set(topPicks.map((p) => p.userId));
      const remainder = pool.filter((p) => !topIds.has(p.userId));
      const randomPicks = this.shuffle(remainder).slice(0, count - topPicks.length);
      selected = [...topPicks, ...randomPicks];
    }

    const grantedAt = new Date();
    const granted: string[] = [];
    for (const p of selected) {
      const existing = await this.prisma.whitelistSlot.findUnique({
        where: { campaignId_userId: { campaignId, userId: p.userId } },
      });
      if (existing) {
        if (existing.status !== WhitelistStatus.GRANTED) {
          await this.prisma.whitelistSlot.update({
            where: { id: existing.id },
            data: { status: WhitelistStatus.GRANTED, grantedBy: project.ownerId, grantedAt },
          });
        } else {
          continue;
        }
      } else {
        await this.prisma.whitelistSlot.create({
          data: {
            campaignId,
            userId: p.userId,
            grantedBy: project.ownerId,
            status: WhitelistStatus.GRANTED,
            grantedAt,
          },
        });
      }
      await this.prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'WHITELIST_GRANTED',
          message: `You were selected for the ${campaign.title} whitelist.`,
          relatedCampaignId: campaignId,
        },
      });
      if (p.user.email) {
        await this.mail.sendWhitelistGranted(p.user.email, {
          username: p.user.username,
          campaignTitle: campaign.title,
        });
      }
      granted.push(p.userId);
    }
    return {
      granted: granted.length,
      mode,
      userIds: granted,
    };
  }

  private shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
