import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { HttpStatus } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Chain } from '../prisma-enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeUser<T extends { walletAddress?: string | null }>(user: T) {
    const { walletAddress: _w, ...rest } = user;
    return {
      ...rest,
      walletLinked: Boolean(_w),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }
    const s = this.sanitizeUser(user);
    return { ...s, createdAt: user.createdAt.toISOString() };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        avatarUrl: dto.avatarUrl,
      },
    });
    const s = this.sanitizeUser(user);
    return { ...s, createdAt: user.createdAt.toISOString() };
  }

  async dashboard(userId: string) {
    const participants = await this.prisma.campaignParticipant.findMany({
      where: { userId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            endDate: true,
            chain: true,
            rewardType: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
    const walletRows: { campaignId: string; chain: Chain }[] = await this.prisma.walletEntry.findMany({
      where: { userId },
      select: {
        campaignId: true,
        chain: true,
        submittedAt: true,
        updatedAt: true,
      },
    });
    const walletByCampaign = new Map(walletRows.map((w) => [w.campaignId, w]));
    return {
      campaigns: participants.map((p: (typeof participants)[number]) => ({
        campaignId: p.campaignId,
        title: p.campaign.title,
        status: p.campaign.status,
        chain: p.campaign.chain,
        rewardType: p.campaign.rewardType,
        pointsEarned: p.pointsEarned,
        joinedAt: p.joinedAt.toISOString(),
        endDate: p.campaign.endDate.toISOString(),
        walletSubmitted: walletByCampaign.has(p.campaignId),
        walletChain: walletByCampaign.get(p.campaignId)?.chain ?? null,
      })),
    };
  }

  async listNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return {
      data: data.map((n: (typeof data)[number]) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        relatedCampaignId: n.relatedCampaignId,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: true };
  }
}
