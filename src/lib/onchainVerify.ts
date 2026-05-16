import { createPublicClient, http, formatUnits, type Address, type Chain } from 'viem';
import {
  mainnet,
  base,
  arbitrum,
  polygon,
  bsc,
  avalanche,
} from 'viem/chains';
import type { OnchainChain, OnchainTaskConfig, Task } from '@/types';

// Map of EVM chains supported by the client-side verifier. SOL is intentionally
// excluded — Solana onchain verification requires a different client (web3.js /
// @solana/spl-token) and is handled server-side by the verification worker.
const CHAIN_MAP: Partial<Record<OnchainChain, Chain>> = {
  ETH: mainnet,
  BASE: base,
  ARB: arbitrum,
  MATIC: polygon,
  BNB: bsc,
  AVAX: avalanche,
};

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export type OnchainVerifyResult =
  | {
      ok: true;
      held: number;
      required: number;
      symbol?: string;
      chain: OnchainChain;
    }
  | { ok: false; reason: string };

/**
 * Verify that `wallet` holds at least `config.minBalance` of the configured
 * token / NFT. Returns a structured result rather than throwing so the UI can
 * render failure modes cleanly.
 */
export async function verifyOnchainTask(
  task: Task,
  wallet: Address,
): Promise<OnchainVerifyResult> {
  const config: OnchainTaskConfig | undefined = task.onchain;
  if (!config) {
    return { ok: false, reason: 'Task is missing onchain configuration.' };
  }

  if (config.chain === 'SOL') {
    return {
      ok: false,
      reason: 'Solana onchain verification is handled server-side; client cannot verify.',
    };
  }
  const chain = CHAIN_MAP[config.chain];
  if (!chain) {
    return { ok: false, reason: `Unsupported chain: ${config.chain}` };
  }

  const client = createPublicClient({ chain, transport: http() });

  try {
    if (task.type === 'hold_nft') {
      const balance = await client.readContract({
        address: config.contractAddress,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [wallet],
      });
      const held = Number(balance);
      if (held < config.minBalance) {
        return {
          ok: false,
          reason: `Wallet holds ${held} ${config.symbol ?? 'NFT'}s on ${config.chain} — need ${config.minBalance}.`,
        };
      }
      return {
        ok: true,
        held,
        required: config.minBalance,
        symbol: config.symbol,
        chain: config.chain,
      };
    }

    // ERC-20 path (hold_token)
    const [rawBalance, decimals] = await Promise.all([
      client.readContract({
        address: config.contractAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [wallet],
      }),
      client
        .readContract({
          address: config.contractAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        })
        .catch(() => 18),
    ]);

    const held = Number(formatUnits(rawBalance, Number(decimals)));
    if (held < config.minBalance) {
      return {
        ok: false,
        reason: `Wallet holds ${held.toLocaleString()} ${config.symbol ?? 'tokens'} on ${config.chain} — need ${config.minBalance}.`,
      };
    }
    return {
      ok: true,
      held,
      required: config.minBalance,
      symbol: config.symbol,
      chain: config.chain,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RPC call failed';
    return { ok: false, reason: message };
  }
}
