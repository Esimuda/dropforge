import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { Chain } from '../../prisma-enums';
import { IsChain } from '../../common/validators/chain.validator';
import { RewardType, TaskType, ProofType, CampaignStatus } from '../../prisma-enums';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskType)
  taskType!: TaskType;

  @IsInt()
  @Min(0)
  points!: number;

  @IsEnum(ProofType)
  proofType!: ProofType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateCampaignDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsChain()
  chain!: Chain;

  @IsEnum(RewardType)
  rewardType!: RewardType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks?: CreateTaskDto[];
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsChain()
  chain?: Chain;

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

export class ExportQueryDto {
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv';

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlyWithWallet?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlyVerified?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPoints?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlyWhitelisted?: boolean;
}

export class WhitelistBodyDto {
  @IsBoolean()
  whitelisted!: boolean;
}

export enum WhitelistMode {
  TOP_PERFORMERS = 'TOP_PERFORMERS',
  RANDOM = 'RANDOM',
  HYBRID = 'HYBRID',
}

export class SelectWhitelistFiltersDto {
  @IsOptional()
  @IsBoolean()
  hasWallet?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPoints?: number;

  @IsOptional()
  @IsBoolean()
  completedRequired?: boolean;
}

export class SelectWhitelistDto {
  @IsEnum(WhitelistMode)
  mode!: WhitelistMode;

  @IsInt()
  @Min(1)
  count!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SelectWhitelistFiltersDto)
  filters?: SelectWhitelistFiltersDto;
}
