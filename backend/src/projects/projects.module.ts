import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ExportService } from './export.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ExportService],
})
export class ProjectsModule {}
