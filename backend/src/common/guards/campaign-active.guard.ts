import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppHttpException } from '../exceptions/app-http.exception';
import { ErrorCodes } from '../errors/error-codes';
import { HttpStatus } from '@nestjs/common';
import { CampaignStatus } from '../../prisma-enums';

@Injectable()
export class CampaignActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const campaignId =
      req.params?.campaignId ||
      req.params?.id ||
      req.body?.campaignId;
    if (!campaignId) {
      return true;
    }
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, deletedAt: null },
    });
    if (!campaign) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Campaign not found.', HttpStatus.NOT_FOUND);
    }
    const now = new Date();
    if (campaign.status === CampaignStatus.ENDED || now > campaign.endDate) {
      throw new AppHttpException(
        ErrorCodes.CAMPAIGN_ENDED,
        'This campaign has already ended.',
        HttpStatus.BAD_REQUEST,
      );
    }
    (req as { campaign?: typeof campaign }).campaign = campaign;
    return true;
  }
}
