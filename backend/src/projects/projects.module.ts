import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ExportService } from './export.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ExportService],
})
export class ProjectsModule {}
