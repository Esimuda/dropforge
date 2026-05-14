import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  twitterHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  discordInvite?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  twitterHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  discordInvite?: string;
}
