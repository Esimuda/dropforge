import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationChecksService } from './verification-checks.service';
import { SubmissionStatus } from '../prisma-enums';
import { MailService } from '../mail/mail.service';

@Processor('task-verification')
export class TaskVerificationProcessor {
  private readonly logger = new Logger(TaskVerificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checks: VerificationChecksService,
    private readonly mail: MailService,
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
        case 'VERIFY_NFT_HOLD':
          return this.finalizeNftHold(job.data as { submissionId: string });
        default:
          this.logger.warn(`Unknown job ${job.name}`);
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private async loadSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { user: true, task: true, campaign: true },
    });
    if (!submission || submission.status !== SubmissionStatus.PENDING) {
      return null;
    }
    return submission;
  }

  private async finalizeTwitterFollow(data: { submissionId: string }) {
    const submission = await this.loadSubmission(data.submissionId);
    if (!submission) return;
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyTwitterFollow({
      sourceTwitterId: submission.user.twitterId,
      targetHandle: meta.targetHandle as string,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeTwitterRetweet(data: { submissionId: string }) {
    const submission = await this.loadSubmission(data.submissionId);
    if (!submission) return;
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyTwitterRetweet({
      tweetId: meta.tweetId as string,
      userHandle: submission.user.twitterHandle,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeDiscord(data: { submissionId: string }) {
    const submission = await this.loadSubmission(data.submissionId);
    if (!submission) return;
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyDiscordJoin({
      discordUserId: submission.user.discordId,
      guildId: meta.guildId as string,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeTokenHold(data: { submissionId: string }) {
    const submission = await this.loadSubmission(data.submissionId);
    if (!submission) return;
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyTokenHold({
      walletAddress: submission.user.walletAddress,
      chain: (meta.chain as string) || submission.campaign.chain,
      contractAddress: meta.contractAddress as string,
      minAmount: meta.minAmount as string,
    });
    await this.applyResult(submission, result);
  }

  private async finalizeNftHold(data: { submissionId: string }) {
    const submission = await this.loadSubmission(data.submissionId);
    if (!submission) return;
    const meta = (submission.task.metadata ?? {}) as Record<string, unknown>;
    const result = await this.checks.verifyNftHold({
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
      user: { email: string | null; username: string | null };
      campaign: { title: string };
    },
    result: { ok: boolean; reason?: string },
  ) {
    const status = result.ok ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED;
    const applied = await this.prisma.$transaction(async (tx: any) => {
      // Idempotency guard: only apply if still PENDING. Returns false if another
      // worker already finalized this submission.
      const fresh = await tx.submission.findUnique({
        where: { id: submission.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== SubmissionStatus.PENDING) {
        return false;
      }
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
          type: result.ok ? 'TASK_APPROVED' : 'TASK_REJECTED',
          message: result.ok
            ? `Auto-verified: "${submission.task.title}" (+${submission.task.points} points).`
            : `Auto-verification failed for "${submission.task.title}". ${result.reason ?? ''}`,
          relatedCampaignId: submission.campaignId,
          relatedTaskId: submission.task.id,
        },
      });
      return true;
    });
    if (!applied) {
      return;
    }
    if (result.ok) {
      await this.recomputeEligibility(submission.campaignId, submission.userId);
    }
    if (submission.user.email) {
      const ctx = {
        username: submission.user.username,
        taskTitle: submission.task.title,
        campaignTitle: submission.campaign.title,
        points: submission.task.points,
        reason: result.reason ?? null,
      };
      if (result.ok) {
        await this.mail.sendTaskApproved(submission.user.email, ctx);
      } else {
        await this.mail.sendTaskRejected(submission.user.email, ctx);
      }
    }
  }

  private async recomputeEligibility(campaignId: string, userId: string) {
    const required = await this.prisma.task.findMany({
      where: { campaignId, isRequired: true },
      select: { id: true },
    });
    const approved = await this.prisma.submission.findMany({
      where: { campaignId, userId, status: SubmissionStatus.APPROVED },
      distinct: ['taskId'],
      select: { taskId: true },
    });
    const approvedSet = new Set(approved.map((a: (typeof approved)[number]) => a.taskId));
    const tasksCompleted = approvedSet.size;
    const eligible =
      required.length > 0 &&
      required.every((t: (typeof required)[number]) => approvedSet.has(t.id));
    await this.prisma.campaignParticipant.updateMany({
      where: { campaignId, userId },
      data: { isEligible: eligible, tasksCompleted },
    });
  }
}
