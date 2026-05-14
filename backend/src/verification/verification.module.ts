import { Module } from '@nestjs/common';
import { TaskVerificationProcessor } from './task-verification.processor';
import { VerificationChecksService } from './verification-checks.service';

@Module({
  providers: [TaskVerificationProcessor, VerificationChecksService],
})
export class VerificationModule {}
