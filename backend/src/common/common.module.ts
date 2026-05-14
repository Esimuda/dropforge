import { Global, Module } from '@nestjs/common';
import { WalletCryptoService } from './crypto/wallet-crypto.service';

@Global()
@Module({
  providers: [WalletCryptoService],
  exports: [WalletCryptoService],
})
export class CommonModule {}
