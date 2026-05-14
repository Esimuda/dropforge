import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Chain } from '../../prisma-enums';

export class CreateWalletEntryDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string;

  @IsString()
  @IsNotEmpty()
  walletAddress!: string;

  @IsEnum(Chain)
  chain!: Chain;
}
