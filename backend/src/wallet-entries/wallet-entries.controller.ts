import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WalletEntriesService } from './wallet-entries.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CampaignActiveGuard } from '../common/guards/campaign-active.guard';
import { CreateWalletEntryDto } from './dto/wallet-entry.dto';

@Controller('wallet-entries')
export class WalletEntriesController {
  constructor(private readonly walletEntries: WalletEntriesService) {}

  @Get('me')
  listMine(@CurrentUser() user: { sub: string }) {
    return this.walletEntries.listMine(user.sub);
  }

  @Get(':campaignId')
  oneForCampaign(
    @CurrentUser() user: { sub: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.walletEntries.getForCampaign(user.sub, campaignId);
  }

  @UseGuards(CampaignActiveGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  submit(@CurrentUser() user: { sub: string }, @Body() dto: CreateWalletEntryDto) {
    return this.walletEntries.submit(user.sub, dto);
  }
}
