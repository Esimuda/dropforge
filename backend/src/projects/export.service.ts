import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletCryptoService } from '../common/crypto/wallet-crypto.service';
import { SubmissionStatus, WhitelistStatus } from '../prisma-enums';

type TaskRow = { id: string; isRequired: boolean };

export type ExportFilters = {
  onlyWithWallet?: boolean;
  onlyVerified?: boolean;
  minPoints?: number;
  onlyWhitelisted?: boolean;
};

export type ExportRow = {
  username: string | null;
  twitterHandle: string | null;
  discordHandle: string | null;
  walletAddress: string | null;
  chain: string | null;
  pointsEarned: number;
  tasksCompleted: number;
  joinedAt: string;
  whitelisted: boolean;
};

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletCrypto: WalletCryptoService,
  ) {}

  private async logExport(
    campaignId: string,
    exportedBy: string,
    format: string,
    filters: ExportFilters,
    recordCount: number,
  ) {
    await this.prisma.exportLog.create({
      data: {
        campaignId,
        exportedBy,
        format,
        filters: filters as object,
        recordCount,
      },
    });
  }

  private async approvedRequiredTasksCount(
    campaignId: string,
    userId: string,
    requiredTasks: TaskRow[],
  ): Promise<number> {
    if (!requiredTasks.length) {
      return 0;
    }
    const ids = requiredTasks.map((t) => t.id);
    const subs = await this.prisma.submission.findMany({
      where: {
        campaignId,
        userId,
        status: SubmissionStatus.APPROVED,
        taskId: { in: ids },
      },
      distinct: ['taskId'],
      select: { taskId: true },
    });
    return subs.length;
  }

  private async buildRows(
    campaignId: string,
    filters: ExportFilters,
  ): Promise<ExportRow[]> {
    const participants = await this.prisma.campaignParticipant.findMany({
      where: { campaignId },
      include: {
        user: true,
        campaign: { include: { tasks: true } },
      },
    });

    const wallets: {
      userId: string;
      encryptedWalletAddress: string;
      iv: string;
      chain: string;
    }[] = await this.prisma.walletEntry.findMany({ where: { campaignId } });
    const walletMap = new Map(wallets.map((w) => [w.userId, w]));

    const slots: { userId: string; status: WhitelistStatus }[] =
      await this.prisma.whitelistSlot.findMany({ where: { campaignId } });
    const whitelistSet = new Set(
      slots.filter((s) => s.status === WhitelistStatus.GRANTED).map((s) => s.userId),
    );

    const rows: ExportRow[] = [];
    for (const p of participants) {
      if (filters.minPoints != null && p.pointsEarned < filters.minPoints) {
        continue;
      }
      const isWhitelisted = whitelistSet.has(p.userId);
      if (filters.onlyWhitelisted && !isWhitelisted) {
        continue;
      }
      const w = walletMap.get(p.userId);
      if (filters.onlyWithWallet && !w) {
        continue;
      }
      const requiredTasks = p.campaign.tasks.filter((t: TaskRow) => t.isRequired);
      const tasksCompleted = await this.approvedRequiredTasksCount(
        campaignId,
        p.userId,
        requiredTasks,
      );
      if (filters.onlyVerified) {
        if (tasksCompleted < requiredTasks.length || !p.isEligible) {
          continue;
        }
      }
      let walletAddress: string | null = null;
      if (w) {
        try {
          walletAddress = this.walletCrypto.decrypt({
            encryptedWalletAddress: w.encryptedWalletAddress,
            iv: w.iv,
          });
        } catch {
          walletAddress = null;
        }
      }
      rows.push({
        username: p.user.username,
        twitterHandle: p.user.twitterHandle,
        discordHandle: p.user.discordHandle,
        walletAddress,
        chain: w?.chain ?? null,
        pointsEarned: p.pointsEarned,
        tasksCompleted,
        joinedAt: p.joinedAt.toISOString(),
        whitelisted: isWhitelisted,
      });
    }
    return rows;
  }

  async generateJson(
    campaignId: string,
    filters: ExportFilters,
    exportedBy: string,
  ): Promise<ExportRow[]> {
    const rows = await this.buildRows(campaignId, filters);
    await this.logExport(campaignId, exportedBy, 'JSON', filters, rows.length);
    return rows;
  }

  async generateCsv(
    campaignId: string,
    filters: ExportFilters,
    exportedBy: string,
  ): Promise<string> {
    const rows = await this.buildRows(campaignId, filters);
    await this.logExport(campaignId, exportedBy, 'CSV', filters, rows.length);
    const headers = [
      'username',
      'twitterHandle',
      'discordHandle',
      'walletAddress',
      'chain',
      'pointsEarned',
      'tasksCompleted',
      'joinedAt',
      'whitelisted',
    ];
    const esc = (v: string | number | boolean | null) => {
      if (v === null || v === undefined) {
        return '';
      }
      const s = String(v);
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push(
        [
          esc(r.username),
          esc(r.twitterHandle),
          esc(r.discordHandle),
          esc(r.walletAddress),
          esc(r.chain),
          esc(r.pointsEarned),
          esc(r.tasksCompleted),
          esc(r.joinedAt),
          esc(r.whitelisted),
        ].join(','),
      );
    }
    return lines.join('\n');
  }
}
