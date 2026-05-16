import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CampaignStatus } from '../prisma-enums';

const ENDING_WINDOW_HOURS = 24;

@Injectable()
export class CampaignsSchedulerService {
  private readonly logger = new Logger(CampaignsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // Auto-transition ACTIVE → ENDED once endDate has passed.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoEndCampaigns() {
    const now = new Date();
    const ended = await this.prisma.campaign.updateMany({
      where: {
        status: CampaignStatus.ACTIVE,
        endDate: { lt: now },
        deletedAt: null,
      },
      data: { status: CampaignStatus.ENDED },
    });
    if (ended.count > 0) {
      this.logger.log(`Auto-ended ${ended.count} campaign(s).`);
    }
  }

  // Notify participants when a campaign is within ~24h of its endDate.
  // Idempotency: a CAMPAIGN_ENDING_24H Notification per (userId, campaignId)
  // is created once; subsequent runs skip users that already have one.
  @Cron(CronExpression.EVERY_HOUR)
  async notifyCampaignsEndingSoon() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + ENDING_WINDOW_HOURS * 60 * 60 * 1000);
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        endDate: { gt: now, lte: windowEnd },
        deletedAt: null,
      },
      select: { id: true, title: true, endDate: true },
    });
    for (const c of campaigns) {
      const participants = await this.prisma.campaignParticipant.findMany({
        where: { campaignId: c.id },
        include: { user: { select: { id: true, email: true, username: true } } },
      });
      const hoursRemaining = Math.max(
        1,
        Math.round((c.endDate.getTime() - now.getTime()) / (60 * 60 * 1000)),
      );
      for (const p of participants) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: p.userId,
            type: 'CAMPAIGN_ENDING',
            relatedCampaignId: c.id,
          },
          select: { id: true },
        });
        if (existing) {
          continue;
        }
        await this.prisma.notification.create({
          data: {
            userId: p.userId,
            type: 'CAMPAIGN_ENDING',
            message: `${c.title} ends in ~${hoursRemaining} hour(s).`,
            relatedCampaignId: c.id,
          },
        });
        if (p.user.email) {
          await this.mail.sendCampaignEnding(p.user.email, {
            username: p.user.username,
            campaignTitle: c.title,
            hoursRemaining,
          });
        }
      }
    }
  }
}
