import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type TaskMailCtx = {
  username: string | null;
  taskTitle: string;
  campaignTitle: string;
  points?: number;
  reason?: string | null;
};

type CampaignEndingCtx = {
  username: string | null;
  campaignTitle: string;
  hoursRemaining: number;
};

type WhitelistCtx = {
  username: string | null;
  campaignTitle: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY');
    this.from =
      this.config.get<string>('RESEND_FROM') ??
      'Dropforge <onboarding@resend.dev>';
    if (key) {
      this.resend = new Resend(key);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Skipping email to ${to}: RESEND_API_KEY not set`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (e) {
      this.logger.error(`Failed to send email to ${to}: ${(e as Error).message}`);
    }
  }

  async sendTaskApproved(to: string, ctx: TaskMailCtx): Promise<void> {
    const subject = `Task approved — ${ctx.taskTitle}`;
    const html = `
      <p>Hi ${ctx.username ?? 'there'},</p>
      <p>Your submission for <strong>${ctx.taskTitle}</strong> in <strong>${ctx.campaignTitle}</strong> has been approved${
      ctx.points ? ` (+${ctx.points} points)` : ''
    }.</p>
      <p>Keep up the good work!</p>
    `;
    await this.sendEmail(to, subject, html);
  }

  async sendTaskRejected(to: string, ctx: TaskMailCtx): Promise<void> {
    const subject = `Task needs review — ${ctx.taskTitle}`;
    const html = `
      <p>Hi ${ctx.username ?? 'there'},</p>
      <p>Your submission for <strong>${ctx.taskTitle}</strong> in <strong>${ctx.campaignTitle}</strong> was rejected.</p>
      ${ctx.reason ? `<p><em>Reason:</em> ${ctx.reason}</p>` : ''}
      <p>You can review the task details and try again if applicable.</p>
    `;
    await this.sendEmail(to, subject, html);
  }

  async sendCampaignEnding(to: string, ctx: CampaignEndingCtx): Promise<void> {
    const subject = `${ctx.campaignTitle} ends soon`;
    const html = `
      <p>Hi ${ctx.username ?? 'there'},</p>
      <p>The campaign <strong>${ctx.campaignTitle}</strong> ends in about ${ctx.hoursRemaining} hour(s).</p>
      <p>Finish your pending tasks and submit your wallet before the deadline.</p>
    `;
    await this.sendEmail(to, subject, html);
  }

  async sendWhitelistGranted(to: string, ctx: WhitelistCtx): Promise<void> {
    const subject = `You're on the ${ctx.campaignTitle} whitelist`;
    const html = `
      <p>Hi ${ctx.username ?? 'there'},</p>
      <p>Congratulations — you've been granted a whitelist slot for <strong>${ctx.campaignTitle}</strong>.</p>
    `;
    await this.sendEmail(to, subject, html);
  }
}
