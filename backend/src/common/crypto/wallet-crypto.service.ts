import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Injectable()
export class WalletCryptoService {
  private getKey(): Buffer {
    const raw = process.env.WALLET_ENCRYPTION_KEY || '';
    if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
      return Buffer.from(raw, 'hex');
    }
    return scryptSync(raw, 'dropforge-wallet-salt', 32);
  }

  /** Returns base64: iv:ciphertext:authTag (all hex or base64 segments) */
  encrypt(plain: string): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), enc.toString('base64'), tag.toString('base64')].join('.');
  }

  decrypt(payload: string): string {
    const key = this.getKey();
    const [ivB64, dataB64, tagB64] = payload.split('.');
    if (!ivB64 || !dataB64 || !tagB64) {
      throw new Error('Invalid ciphertext');
    }
    const iv = Buffer.from(ivB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
