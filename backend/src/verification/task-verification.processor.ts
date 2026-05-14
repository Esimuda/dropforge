import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationChecksService } from './verification-checks.service';
import { SubmissionStatus } from '../prisma-enums';

@Processor('task-verification')
export class TaskVerificationProcessor {
  private readonly logger = new Logger(TaskVerificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checks: VerificationChecksService,
  ) {}

  @Process('*')
  async handle(job: Job<Record<string, unknown>>) {
    try {
      switch (job.name) {
        case 'VERIFY_TWITTER_FOLLOW':
          return this.finalizeTwitterFollow(job.data as { submissionId: string });
        case 'VERIFY_TWITTER_RETWEET':
          return this.finalizeTwitterRetweet(job.data as { submissionId: string });
        case 'VERIFY_DISCORD_JOIN':
          return this.finalizeDiscord(job.data as { submissionId: string });
        case 'VERIFY_TOKEN_HOLD':
          return this.finalizeTokenHold(job.data as { submissionId: string });
        default:
          this.logger.warn(`Unknown job ${job.name}`);
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private async finalizeTwitterFollow(data: { submissionId: string }) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: { user: true, task: true },
    });
    if (!submission || submission.status !== SubmissionStatus.PENDING) {
      return;
    }
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyTwitterFollow({
      sourceTwitterId: submission.user.twitterId,
      targetHandle: meta.targetHandle as string,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeTwitterRetweet(data: { submissionId: string }) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: { user: true, task: true },
    });
    if (!submission || submission.status !== SubmissionStatus.PENDING) {
      return;
    }
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyTwitterRetweet({
      tweetId: meta.tweetId as string,
      userHandle: submission.user.twitterHandle,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeDiscord(data: { submissionId: string }) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: { user: true, task: true },
    });
    if (!submission || submission.status !== SubmissionStatus.PENDING) {
      return;
    }
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyDiscordJoin({
      discordUserId: submission.user.discordId,
      guildId: meta.guildId as string,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeTokenHold(data: { submissionId: string }) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: { user: true, task: true, campaign: true },
    });
    if (!submission || submission.status !== SubmissionStatus.PENDING) {
      return;
    }
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyTokenHold({
      walletAddress: submission.user.walletAddress,
      chain: (meta.chain as string) || submission.campaign.chain,
      contractAddress: meta.contractAddress as string,
      minAmount: meta.minAmount as string,
    });
    await this.applyResult(submission, result);
  }

  private async applyResult(
    submission: {
      id: string;
      userId: string;
      campaignId: string;
      task: { id: string; title: string; points: number };
    },
    result: { ok: boolean; reason?: string },
  ) {
    const status = result.ok ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED;
    await this.prisma.$transaction(async (tx: any) => {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status,
          reviewNote: result.reason,
          reviewedAt: new Date(),
        },
      });
      if (result.ok) {
        await tx.campaignParticipant.updateMany({
          where: { campaignId: submission.campaignId, userId: submission.userId },
          data: { pointsEarned: { increment: submission.task.points } },
        });
      }
      await tx.notification.create({
        data: {
          userId: submission.userId,
          type: result.ok ? 'TASK_AUTO_APPROVED' : 'TASK_AUTO_REJECTED',
          message: result.ok
            ? `Auto-verified: "${submission.task.title}" (+${submission.task.points} points).`
            : `Auto-verification failed for "${submission.task.title}". ${result.reason ?? ''}`,
          relatedCampaignId: submission.campaignId,
        },
      });
    });
    if (result.ok) {
      await this.recomputeEligibility(submission.campaignId, submission.userId);
    }
  }

  private async recomputeEligibility(campaignId: string, userId: string) {
    const required = await this.prisma.task.findMany({
      where: { campaignId, isRequired: true },
    });
    if (!required.length) {
      return;
    }
    const approved = await this.prisma.submission.findMany({
      where: { campaignId, userId, status: SubmissionStatus.APPROVED },
      distinct: ['taskId'],
      select: { taskId: true },
    });
    const approvedSet = new Set(approved.map((a: (typeof approved)[number]) => a.taskId));
    const eligible = required.every((t: (typeof required)[number]) => approvedSet.has(t.id));
    await this.prisma.campaignParticipant.updateMany({
      where: { campaignId, userId },
      data: { isEligible: eligible },
    });
  }
}
