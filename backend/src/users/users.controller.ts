import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.users.getProfile(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: { sub: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  @Get('me/dashboard')
  dashboard(@CurrentUser() user: { sub: string }) {
    return this.users.dashboard(user.sub);
  }

  @Get('me/notifications')
  notifications(
    @CurrentUser() user: { sub: string },
    @Query() q: PaginationQueryDto,
  ) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    return this.users.listNotifications(user.sub, page, limit);
  }

  @Patch('me/notifications/read')
  readNotifications(@CurrentUser() user: { sub: string }) {
    return this.users.markAllNotificationsRead(user.sub);
  }
}
