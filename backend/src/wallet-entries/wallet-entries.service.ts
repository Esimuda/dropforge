import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletCryptoService } from '../common/crypto/wallet-crypto.service';
import { CreateWalletEntryDto } from './dto/wallet-entry.dto';
import { CampaignStatus } from '../prisma-enums';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';
import { isValidWalletForChain, normalizeEvmAddress } from './wallet-validation';

@Injectable()
export class WalletEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletCrypto: WalletCryptoService,
  ) {}

  async submit(userId: string, dto: CreateWalletEntryDto) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: dto.campaignId, deletedAt: null },
    });
    if (!campaign) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Campaign not found', HttpStatus.NOT_FOUND);
    }
    const now = new Date();
    if (now > campaign.endDate || campaign.status === CampaignStatus.ENDED) {
      throw new AppHttpException(
        ErrorCodes.CAMPAIGN_ENDED,
        'This campaign has already ended.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: dto.campaignId, userId } },
    });
    if (!participant) {
      throw new AppHttpException(
        ErrorCodes.FORBIDDEN,
        'Join the campaign before submitting a wallet.',
        HttpStatus.FORBIDDEN,
      );
    }
    if (!isValidWalletForChain(dto.chain, dto.walletAddress)) {
      throw new AppHttpException(
        ErrorCodes.INVALID_WALLET,
        'Wallet address format is invalid for the selected chain.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const plain = dto.chain === 'SOL' ? dto.walletAddress : normalizeEvmAddress(dto.walletAddress);
    const encrypted = this.walletCrypto.encrypt(plain);
    const existing = await this.prisma.walletEntry.findUnique({
      where: { campaignId_userId: { campaignId: dto.campaignId, userId } },
    });
    const row = existing
      ? await this.prisma.walletEntry.update({
          where: { id: existing.id },
          data: {
            encryptedWalletAddress: encrypted.encryptedWalletAddress,
            iv: encrypted.iv,
            chain: dto.chain,
          },
        })
      : await this.prisma.walletEntry.create({
          data: {
            campaignId: dto.campaignId,
            userId,
            encryptedWalletAddress: encrypted.encryptedWalletAddress,
            iv: encrypted.iv,
            chain: dto.chain,
          },
        });
    return {
      id: row.id,
      campaignId: row.campaignId,
      chain: row.chain,
      submittedAt: row.submittedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listMine(userId: string) {
    const rows = await this.prisma.walletEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      campaignId: r.campaignId,
      chain: r.chain,
      submittedAt: r.submittedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getForCampaign(userId: string, campaignId: string) {
    const row = await this.prisma.walletEntry.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (!row) {
      throw new AppHttpException(ErrorCodes.NOT_FOUND, 'Wallet entry not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: row.id,
      campaignId: row.campaignId,
      chain: row.chain,
      submittedAt: row.submittedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
