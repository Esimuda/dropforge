import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'task-verification' })],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
