import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';

export type TokenPair = { accessToken: string; refreshToken: string; jti: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private accessSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-access';
  }

  private refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh';
  }

  async issueTokensForUser(userId: string): Promise<TokenPair> {
    const jti = randomUUID();
    const refreshExpDays = 7;
    const expiresAt = new Date(Date.now() + refreshExpDays * 24 * 60 * 60 * 1000);
    const refreshToken = this.jwt.sign(
      { sub: userId, typ: 'refresh', jti },
      { secret: this.refreshSecret(), expiresIn: `${refreshExpDays}d` },
    );
    await this.prisma.refreshToken.create({
      data: { userId, jti, expiresAt },
    });
    const accessToken = this.jwt.sign(
      { sub: userId, typ: 'access' },
      { secret: this.accessSecret(), expiresIn: '15m' },
    );
    return { accessToken, refreshToken, jti };
  }

  async validateRefreshToken(refreshToken: string): Promise<{ userId: string; jti: string }> {
    let payload: { sub: string; typ?: string; jti?: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.refreshSecret(),
      }) as { sub: string; typ?: string; jti?: string };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.typ !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const row = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });
    if (!row || row.userId !== payload.sub || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }
    return { userId: payload.sub, jti: payload.jti };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const { userId } = await this.validateRefreshToken(refreshToken);
    const accessToken = this.jwt.sign(
      { sub: userId, typ: 'access' },
      { secret: this.accessSecret(), expiresIn: '15m' },
    );
    return { accessToken };
  }

  async revokeRefreshByJti(jti: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { jti } });
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    let payload: { jti?: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.refreshSecret(),
      }) as { jti?: string };
    } catch {
      return;
    }
    if (payload.jti) {
      await this.revokeRefreshByJti(payload.jti);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async loginWithTwitter(accessToken: string) {
    const { data } = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { 'user.fields': 'profile_image_url,username,name' },
    });
    const u = data?.data;
    if (!u?.id) {
      throw new BadRequestException('Could not verify Twitter account');
    }
    const user = await this.prisma.user.upsert({
      where: { twitterId: u.id },
      create: {
        twitterId: u.id,
        twitterHandle: u.username,
        username: u.name || u.username,
        avatarUrl: u.profile_image_url,
      },
      update: {
        twitterHandle: u.username,
        username: u.name || u.username,
        avatarUrl: u.profile_image_url ?? undefined,
      },
    });
    return this.issueTokensForUser(user.id);
  }

  async loginWithDiscord(accessToken: string) {
    const { data } = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!data?.id) {
      throw new BadRequestException('Could not verify Discord account');
    }
    const username = data.global_name || data.username;
    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
      : null;
    const user = await this.prisma.user.upsert({
      where: { discordId: data.id },
      create: {
        discordId: data.id,
        discordHandle: data.username,
        username,
        avatarUrl,
      },
      update: {
        discordHandle: data.username,
        username: username ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      },
    });
    return this.issueTokensForUser(user.id);
  }

  async loginWithWallet(address: string, message: string, signature: string) {
    const normalized = address.startsWith('0x') ? address : `0x${address}`;
    let recovered: string;
    try {
      recovered = ethers.verifyMessage(message, signature);
    } catch {
      throw new BadRequestException('Invalid signature');
    }
    if (recovered.toLowerCase() !== ethers.getAddress(normalized).toLowerCase()) {
      throw new BadRequestException('Signature does not match wallet');
    }
    const checksum = ethers.getAddress(normalized);
    const user = await this.prisma.user.upsert({
      where: { walletAddress: checksum },
      create: {
        walletAddress: checksum,
        username: `${checksum.slice(0, 6)}…${checksum.slice(-4)}`,
      },
      update: {},
    });
    return this.issueTokensForUser(user.id);
  }
}
