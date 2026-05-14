import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TasksService } from './tasks.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { SubmitTaskDto, VerifySubmissionDto } from './dto/task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.tasks.getTask(id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: SubmitTaskDto,
  ) {
    return this.tasks.submitTask(id, user.sub, dto);
  }

  @UseGuards(ProjectOwnerGuard)
  @Patch(':id/submissions/:submissionId/verify')
  verify(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: VerifySubmissionDto,
  ) {
    return this.tasks.verifySubmission(user.sub, id, submissionId, dto);
  }
}
