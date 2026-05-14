import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  ExportQueryDto,
  WhitelistBodyDto,
} from './dto/campaign.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }], { storage: memoryStorage() }),
  )
  register(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateProjectDto,
    @UploadedFiles() files?: { logo?: Express.Multer.File[] },
  ) {
    const buf = files?.logo?.[0]?.buffer;
    return this.projects.registerProject(user.sub, dto, buf);
  }

  @UseGuards(ProjectOwnerGuard)
  @Get('me')
  myProject(@CurrentUser() user: { sub: string }) {
    return this.projects.getMyProject(user.sub);
  }

  @UseGuards(ProjectOwnerGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }], { storage: memoryStorage() }),
  )
  @Patch('me')
  updateMyProject(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateProjectDto,
    @UploadedFiles() files?: { logo?: Express.Multer.File[] },
  ) {
    const buf = files?.logo?.[0]?.buffer;
    return this.projects.updateMyProject(user.sub, dto, buf);
  }

  @UseGuards(ProjectOwnerGuard)
  @Get('me/campaigns')
  listCampaigns(@CurrentUser() user: { sub: string }, @Query() q: PaginationQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    return this.projects.listMyCampaigns(user.sub, page, limit);
  }

  @UseGuards(ProjectOwnerGuard)
  @Post('me/campaigns')
  createCampaign(@CurrentUser() user: { sub: string }, @Body() dto: CreateCampaignDto) {
    return this.projects.createCampaign(user.sub, dto);
  }

  @UseGuards(ProjectOwnerGuard)
  @Patch('me/campaigns/:id')
  updateCampaign(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.projects.updateCampaign(user.sub, id, dto);
  }

  @UseGuards(ProjectOwnerGuard)
  @Delete('me/campaigns/:id')
  deleteCampaign(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.projects.deleteCampaign(user.sub, id);
  }

  @UseGuards(ProjectOwnerGuard)
  @Post('me/campaigns/:id/publish')
  publish(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.projects.publishCampaign(user.sub, id);
  }

  @UseGuards(ProjectOwnerGuard)
  @Get('me/campaigns/:id/participants')
  participants(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    return this.projects.listParticipants(user.sub, id, page, limit);
  }

  @UseGuards(ProjectOwnerGuard)
  @Get('me/campaigns/:id/export')
  async export(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Query() q: ExportQueryDto,
  ) {
    const format = q.format === 'csv' ? 'csv' : 'json';
    const filters = {
      onlyWithWallet: q.onlyWithWallet,
      onlyVerified: q.onlyVerified,
      minPoints: q.minPoints,
      onlyWhitelisted: q.onlyWhitelisted,
    };
    return this.projects.exportCampaign(user.sub, id, format, filters);
  }

  @UseGuards(ProjectOwnerGuard)
  @Patch('me/campaigns/:id/participants/:userId/whitelist')
  whitelist(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: WhitelistBodyDto,
  ) {
    return this.projects.setWhitelist(user.sub, id, userId, body.whitelisted);
  }
}
