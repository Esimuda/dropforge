import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY');
    if (key) {
      this.resend = new Resend(key);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Skipping email to ${to}: RESEND_API_KEY not set`);
      return;
    }
    await this.resend.emails.send({
      from: 'Dropforge <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
  }
}
