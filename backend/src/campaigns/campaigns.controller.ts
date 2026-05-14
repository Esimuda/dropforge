import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignListQueryDto } from './dto/campaign-list-query.dto';
import { Public } from '../common/decorators/public.decorator';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { Req } from '@nestjs/common';
import { Request } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Public()
  @Get()
  list(@Query() q: CampaignListQueryDto) {
    return this.campaigns.listPublic(q);
  }

  @Public()
  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  detail(@Param('id') id: string, @Req() req: Request & { user?: { sub: string } }) {
    return this.campaigns.detail(id, req.user?.sub);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.campaigns.join(id, user.sub);
  }

  @Public()
  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    return this.campaigns.leaderboard(id, page, limit);
  }
}
