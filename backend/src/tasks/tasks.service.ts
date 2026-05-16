import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitTaskDto, VerifySubmissionDto } from './dto/task.dto';
import {
  CampaignStatus,
  ProofType,
  SubmissionStatus,
  TaskType,
} from '../prisma-enums';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { MailService } from '../mail/mail.service';

const RETRY_OPTS = { attempts: 3, backoff: { type: 'exponential' as const, delay: 2000 } };

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('task-verification') private readonly verificationQueue: Queue,
    private readonly mail: MailService,
  ) {}

  async getTask(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, campaign: { deletedAt: null } },
      include: { campaign: { select: { id: true, title: true, status: true, endDate: true } } },
    });
    if (!task) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Task not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: task.id,
      campaignId: task.campaignId,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      points: task.points,
      proofType: task.proofType,
      metadata: task.metadata,
      order: task.order,
      isRequired: task.isRequired,
      campaign: {
        ...task.campaign,
        endDate: task.campaign.endDate.toISOString(),
      },
    };
  }

  private async assertOwnerForTask(ownerId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, campaign: { deletedAt: null, project: { ownerId } } },
      include: { campaign: { include: { project: true } } },
    });
    if (!task) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Task not found', HttpStatus.NOT_FOUND);
    }
    if (!task.campaign.project.isVerified) {
      throw new AppHttpException(ErrorCodes.FORBIDDEN, 'Forbidden', HttpStatus.FORBIDDEN);
    }
    return task;
  }

  async submitTask(taskId: string, userId: string, dto: SubmitTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, campaign: { deletedAt: null } },
      include: { campaign: true },
    });
    if (!task) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Task not found', HttpStatus.NOT_FOUND);
    }
    const campaign = task.campaign;
    const now = new Date();
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new AppHttpException(
        ErrorCodes.TASK_LOCKED,
        'This campaign is not active.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (now < campaign.startDate) {
      throw new AppHttpException(
        ErrorCodes.TASK_LOCKED,
        'This campaign has not started yet.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (now > campaign.endDate || campaign.status === CampaignStatus.ENDED) {
      throw new AppHttpException(
        ErrorCodes.CAMPAIGN_ENDED,
        'This campaign has already ended.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: campaign.id, userId } },
    });
    if (!participant) {
      throw new AppHttpException(
        ErrorCodes.FORBIDDEN,
        'Join the campaign before submitting tasks.',
        HttpStatus.FORBIDDEN,
      );
    }
    // Submission has @@unique([taskId, userId]) — if one exists, update its proof and reset to PENDING.
    const existing = await this.prisma.submission.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (existing && existing.status === SubmissionStatus.PENDING) {
      throw new AppHttpException(
        ErrorCodes.ALREADY_SUBMITTED,
        'You already have a pending submission for this task.',
        HttpStatus.CONFLICT,
      );
    }
    if (existing && existing.status === SubmissionStatus.APPROVED) {
      throw new AppHttpException(
        ErrorCodes.ALREADY_SUBMITTED,
        'This task is already approved for you.',
        HttpStatus.CONFLICT,
      );
    }
    const submission = existing
      ? await this.prisma.submission.update({
          where: { id: existing.id },
          data: {
            proofUrl: dto.proofUrl,
            proofText: dto.proofText,
            tweetUrl: dto.tweetUrl,
            screenshotUrl: dto.screenshotUrl,
            status: SubmissionStatus.PENDING,
            reviewNote: null,
            reviewedAt: null,
            submittedAt: new Date(),
          },
        })
      : await this.prisma.submission.create({
          data: {
            taskId,
            userId,
            campaignId: campaign.id,
            proofUrl: dto.proofUrl,
            proofText: dto.proofText,
            tweetUrl: dto.tweetUrl,
            screenshotUrl: dto.screenshotUrl,
            status: SubmissionStatus.PENDING,
          },
        });
    if (task.proofType === ProofType.AUTO) {
      await this.enqueueAutoVerification(submission.id, task, userId);
    }
    return {
      id: submission.id,
      status: submission.status,
      submittedAt: submission.submittedAt.toISOString(),
    };
  }

  private async enqueueAutoVerification(
    submissionId: string,
    task: {
      id: string;
      taskType: TaskType;
      metadata: unknown;
      campaignId: string;
      campaign: { chain: string };
    },
    userId: string,
  ) {
    const meta = (task.metadata ?? {}) as Record<string, unknown>;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const chain = (meta.chain as string) || task.campaign.chain;
    switch (task.taskType) {
      case TaskType.TWITTER_FOLLOW:
        await this.verificationQueue.add(
          'VERIFY_TWITTER_FOLLOW',
          {
            submissionId,
            twitterHandle: user?.twitterHandle,
            targetHandle: meta.targetHandle as string | undefined,
          },
          RETRY_OPTS,
        );
        break;
      case TaskType.TWITTER_RETWEET:
        await this.verificationQueue.add(
          'VERIFY_TWITTER_RETWEET',
          {
            submissionId,
            tweetId: meta.tweetId as string | undefined,
            userHandle: user?.twitterHandle,
          },
          RETRY_OPTS,
        );
        break;
      case TaskType.DISCORD_JOIN:
        await this.verificationQueue.add(
          'VERIFY_DISCORD_JOIN',
          {
            submissionId,
            discordUserId: user?.discordId,
            guildId: meta.guildId as string | undefined,
          },
          RETRY_OPTS,
        );
        break;
      case TaskType.TOKEN_HOLD:
        await this.verificationQueue.add(
          'VERIFY_TOKEN_HOLD',
          {
            submissionId,
            walletAddress: user?.walletAddress,
            chain,
            contractAddress: meta.contractAddress as string | undefined,
            minAmount: meta.minAmount as string | undefined,
          },
          RETRY_OPTS,
        );
        break;
      case TaskType.NFT_HOLD:
        await this.verificationQueue.add(
          'VERIFY_NFT_HOLD',
          {
            submissionId,
            walletAddress: user?.walletAddress,
            chain,
            contractAddress: meta.contractAddress as string | undefined,
            minAmount: (meta.minAmount as string | undefined) ?? '1',
          },
          RETRY_OPTS,
        );
        break;
      default:
        break;
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

  async verifySubmission(
    ownerId: string,
    taskId: string,
    submissionId: string,
    dto: VerifySubmissionDto,
  ) {
    const task = await this.assertOwnerForTask(ownerId, taskId);
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, taskId },
      include: { user: { select: { email: true, username: true } } },
    });
    if (!submission) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Submission not found', HttpStatus.NOT_FOUND);
    }
    if (submission.status !== SubmissionStatus.PENDING) {
      throw new AppHttpException(
        ErrorCodes.CONFLICT,
        'Submission is not pending review.',
        HttpStatus.CONFLICT,
      );
    }
    const status =
      dto.status === 'APPROVED' ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED;
    await this.prisma.$transaction(async (tx: any) => {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status,
          reviewNote: dto.note,
          reviewedAt: new Date(),
        },
      });
      if (status === SubmissionStatus.APPROVED) {
        await tx.campaignParticipant.updateMany({
          where: { campaignId: task.campaignId, userId: submission.userId },
          data: { pointsEarned: { increment: task.points } },
        });
      }
      await tx.notification.create({
        data: {
          userId: submission.userId,
          type: status === SubmissionStatus.APPROVED ? 'TASK_APPROVED' : 'TASK_REJECTED',
          message:
            status === SubmissionStatus.APPROVED
              ? `Your submission for "${task.title}" was approved (+${task.points} points).`
              : `Your submission for "${task.title}" was rejected.${dto.note ? ` Note: ${dto.note}` : ''}`,
          relatedCampaignId: task.campaignId,
          relatedTaskId: task.id,
        },
      });
    });
    if (status === SubmissionStatus.APPROVED) {
      await this.recomputeEligibility(task.campaignId, submission.userId);
    }
    if (submission.user.email) {
      const mailCtx = {
        username: submission.user.username,
        taskTitle: task.title,
        campaignTitle: task.campaign.title,
        points: task.points,
        reason: dto.note ?? null,
      };
      if (status === SubmissionStatus.APPROVED) {
        await this.mail.sendTaskApproved(submission.user.email, mailCtx);
      } else {
        await this.mail.sendTaskRejected(submission.user.email, mailCtx);
      }
    }
    return { id: submission.id, status };
  }
}
