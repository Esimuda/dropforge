import { IsEnum, IsOptional } from 'class-validator';
import type { Chain } from '../../prisma-enums';
import { CampaignStatus, RewardType } from '../../prisma-enums';
import { IsChain } from '../../common/validators/chain.validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CampaignListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsChain()
  chain?: Chain;

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
