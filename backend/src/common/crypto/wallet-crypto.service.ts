import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export type EncryptedWallet = {
  // base64(ciphertext) + '.' + base64(authTag)
  encryptedWalletAddress: string;
  // base64(iv)
  iv: string;
};

@Injectable()
export class WalletCryptoService {
  private getKey(): Buffer {
    const raw = process.env.WALLET_ENCRYPTION_KEY || '';
    if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
      return Buffer.from(raw, 'hex');
    }
    return scryptSync(raw, 'dropforge-wallet-salt', 32);
  }

  encrypt(plain: string): EncryptedWallet {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      encryptedWalletAddress: `${enc.toString('base64')}.${tag.toString('base64')}`,
      iv: iv.toString('base64'),
    };
  }

  decrypt(payload: EncryptedWallet): string {
    const key = this.getKey();
    const [dataB64, tagB64] = payload.encryptedWalletAddress.split('.');
    if (!dataB64 || !tagB64 || !payload.iv) {
      throw new Error('Invalid ciphertext');
    }
    const iv = Buffer.from(payload.iv, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
