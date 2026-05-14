import { IsEnum, IsOptional } from 'class-validator';
import { Chain, CampaignStatus, RewardType } from '../../prisma-enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CampaignListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Chain)
  chain?: Chain;

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
