import { IsNotEmpty, IsString } from 'class-validator';
import type { Chain } from '../../prisma-enums';
import { IsChain } from '../../common/validators/chain.validator';

export class CreateWalletEntryDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string;

  @IsString()
  @IsNotEmpty()
  walletAddress!: string;

  @IsChain()
  chain!: Chain;
}
