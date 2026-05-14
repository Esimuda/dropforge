import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TwitterAuthDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}

export class DiscordAuthDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}

export class WalletAuthDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
