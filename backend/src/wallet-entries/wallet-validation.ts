import { Chain } from '../prisma-enums';
import { ethers } from 'ethers';
import bs58 from 'bs58';

export function isValidWalletForChain(chain: Chain, address: string): boolean {
  if (chain === Chain.SOLANA) {
    try {
      const buf = bs58.decode(address);
      return buf.length === 32;
    } catch {
      return false;
    }
  }
  if (!address) {
    return false;
  }
  return ethers.isAddress(address);
}

export function normalizeEvmAddress(address: string): string {
  return ethers.getAddress(address);
}
