import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ethers } from 'ethers';
import type { Chain } from '../prisma-enums';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const ERC721_ABI = ['function balanceOf(address) view returns (uint256)'];

@Injectable()
export class VerificationChecksService {
  constructor(private readonly config: ConfigService) {}

  async verifyTwitterFollow(params: {
    sourceTwitterId?: string | null;
    targetHandle?: string | null;
  }): Promise<{ ok: boolean; reason?: string }> {
    const bearer = this.config.get<string>('TWITTER_BEARER_TOKEN');
    if (!bearer || !params.sourceTwitterId || !params.targetHandle) {
      return { ok: false, reason: 'Twitter verification is not configured or profile missing.' };
    }
    const target = params.targetHandle.replace(/^@/, '');
    const url = `https://api.twitter.com/2/users/${params.sourceTwitterId}/following`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${bearer}` },
      params: { 'user.fields': 'username', max_results: 1000 },
    });
    const users = (data?.data ?? []) as { username?: string }[];
    const match = users.some((u) => u.username?.toLowerCase() === target.toLowerCase());
    if (!match) {
      return { ok: false, reason: 'Follow relationship not detected.' };
    }
    return { ok: true };
  }

  async verifyTwitterRetweet(params: {
    tweetId?: string | null;
    userHandle?: string | null;
  }): Promise<{ ok: boolean; reason?: string }> {
    const bearer = this.config.get<string>('TWITTER_BEARER_TOKEN');
    if (!bearer || !params.tweetId || !params.userHandle) {
      return { ok: false, reason: 'Twitter verification is not configured or submission incomplete.' };
    }
    const handle = params.userHandle.replace(/^@/, '');
    const url = `https://api.twitter.com/2/tweets/${params.tweetId}/retweeted_by`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${bearer}` },
      params: { max_results: 100, 'user.fields': 'username' },
    });
    const users = (data?.data ?? []) as { username?: string }[];
    const match = users.some((u) => u.username?.toLowerCase() === handle.toLowerCase());
    if (!match) {
      return { ok: false, reason: 'Retweet not detected for this account.' };
    }
    return { ok: true };
  }

  async verifyDiscordJoin(params: {
    discordUserId?: string | null;
    guildId?: string | null;
  }): Promise<{ ok: boolean; reason?: string }> {
    const bot = this.config.get<string>('DISCORD_BOT_TOKEN');
    if (!bot || !params.discordUserId || !params.guildId) {
      return { ok: false, reason: 'Discord verification is not configured or profile missing.' };
    }
    const url = `https://discord.com/api/v10/guilds/${params.guildId}/members/${params.discordUserId}`;
    try {
      await axios.get(url, { headers: { Authorization: `Bot ${bot}` } });
      return { ok: true };
    } catch {
      return { ok: false, reason: 'User is not a member of the Discord server.' };
    }
  }

  async verifyTokenHold(params: {
    walletAddress?: string | null;
    chain?: Chain | string | null;
    contractAddress?: string | null;
    minAmount?: string | null;
  }): Promise<{ ok: boolean; reason?: string }> {
    if (!params.walletAddress || !params.contractAddress) {
      return { ok: false, reason: 'Wallet or contract not provided.' };
    }
    const rpcUrl = this.rpcForChain(params.chain ?? null);
    if (!rpcUrl) {
      return { ok: false, reason: 'RPC not configured for this chain.' };
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const erc20 = new ethers.Contract(params.contractAddress, ERC20_ABI, provider);
    const bal: bigint = await erc20.balanceOf(params.walletAddress);
    const min = params.minAmount ? BigInt(params.minAmount) : 1n;
    if (bal < min) {
      return { ok: false, reason: 'Token balance below minimum.' };
    }
    return { ok: true };
  }

  async verifyNftHold(params: {
    walletAddress?: string | null;
    chain?: Chain | string | null;
    contractAddress?: string | null;
    minAmount?: string | null;
  }): Promise<{ ok: boolean; reason?: string }> {
    if (!params.walletAddress || !params.contractAddress) {
      return { ok: false, reason: 'Wallet or contract not provided.' };
    }
    const rpcUrl = this.rpcForChain(params.chain ?? null);
    if (!rpcUrl) {
      return { ok: false, reason: 'RPC not configured for this chain.' };
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const erc721 = new ethers.Contract(params.contractAddress, ERC721_ABI, provider);
    const bal: bigint = await erc721.balanceOf(params.walletAddress);
    const min = params.minAmount ? BigInt(params.minAmount) : 1n;
    if (bal < min) {
      return { ok: false, reason: 'NFT balance below minimum.' };
    }
    return { ok: true };
  }

  private rpcForChain(chain: Chain | string | null): string | null {
    if (!chain) {
      return this.config.get<string>('RPC_ETHEREUM') ?? null;
    }
    const map: Record<string, string | undefined> = {
      ETH: this.config.get<string>('RPC_ETHEREUM'),
      BASE: this.config.get<string>('RPC_BASE'),
      ARB: this.config.get<string>('RPC_ARBITRUM'),
      MATIC: this.config.get<string>('RPC_POLYGON'),
      BNB: this.config.get<string>('RPC_BSC'),
      AVAX: this.config.get<string>('RPC_AVALANCHE'),
      SOL: this.config.get<string>('RPC_SOLANA'),
    };
    return map[chain] ?? this.config.get<string>('RPC_ETHEREUM') ?? null;
  }
}
