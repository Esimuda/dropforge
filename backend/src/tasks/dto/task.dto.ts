import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitTaskDto {
  @IsOptional()
  @IsUrl()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  proofText?: string;

  @IsOptional()
  @IsUrl()
  tweetUrl?: string;

  @IsOptional()
  @IsUrl()
  screenshotUrl?: string;
}

export class VerifySubmissionDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  note?: string;
}
