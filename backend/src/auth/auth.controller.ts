import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  TwitterAuthDto,
  DiscordAuthDto,
  WalletAuthDto,
} from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

function setAuthCookies(res: Response, access: string, refresh: string) {
  res.cookie('access_token', access, {
    ...cookieBase(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refresh, {
    ...cookieBase(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  const b = cookieBase();
  res.clearCookie('access_token', b);
  res.clearCookie('refresh_token', b);
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('twitter')
  async twitter(@Body() dto: TwitterAuthDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.loginWithTwitter(dto.accessToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { loggedIn: true };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('discord')
  async discord(@Body() dto: DiscordAuthDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.loginWithDiscord(dto.accessToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { loggedIn: true };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('wallet')
  async wallet(@Body() dto: WalletAuthDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.loginWithWallet(dto.address, dto.message, dto.signature);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { loggedIn: true };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refresh =
      (req.cookies?.refresh_token as string | undefined) ||
      (req.body as { refreshToken?: string })?.refreshToken;
    if (!refresh) {
      clearAuthCookies(res);
      return { refreshed: false };
    }
    const { accessToken } = await this.auth.refreshAccessToken(refresh);
    res.cookie('access_token', accessToken, {
      ...cookieBase(),
      maxAge: 15 * 60 * 1000,
    });
    return { refreshed: true };
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refresh =
      (req.cookies?.refresh_token as string | undefined) ||
      (req.body as { refreshToken?: string })?.refreshToken;
    if (refresh) {
      await this.auth.revokeRefreshToken(refresh);
    }
    clearAuthCookies(res);
    return { loggedOut: true };
  }
}
