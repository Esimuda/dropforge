import { ethers } from 'ethers';
import bs58 from 'bs58';
import type { Chain } from '../prisma-enums';

export function isValidWalletForChain(chain: Chain, address: string): boolean {
  if (!address) {
    return false;
  }
  if (chain === 'SOL') {
    try {
      const buf = bs58.decode(address);
      return buf.length === 32;
    } catch {
      return false;
    }
  }
  return ethers.isAddress(address);
}

export function normalizeEvmAddress(address: string): string {
  return ethers.getAddress(address);
}
