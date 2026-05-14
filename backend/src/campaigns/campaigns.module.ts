import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'dev-access',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, OptionalJwtGuard],
})
export class CampaignsModule {}
