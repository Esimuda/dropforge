import { Module } from '@nestjs/common';
import { WalletEntriesService } from './wallet-entries.service';
import { WalletEntriesController } from './wallet-entries.controller';

@Module({
  controllers: [WalletEntriesController],
  providers: [WalletEntriesService],
})
export class WalletEntriesModule {}
