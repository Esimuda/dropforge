import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TasksModule } from './tasks/tasks.module';
import { WalletEntriesModule } from './wallet-entries/wallet-entries.module';
import { VerificationModule } from './verification/verification.module';
import { CommonModule } from './common/common.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    }),
    BullModule.registerQueue({ name: 'task-verification' }),
    CommonModule,
    PrismaModule,
    MailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    CampaignsModule,
    TasksModule,
    WalletEntriesModule,
    VerificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
