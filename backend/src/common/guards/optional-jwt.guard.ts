import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: { sub: string } }>();
    const token =
      (req.cookies?.access_token as string | undefined) ||
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      return true;
    }
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-access',
      }) as { sub: string; typ?: string };
      if (payload.typ === 'access' && payload.sub) {
        req.user = { sub: payload.sub };
      }
    } catch {
      // ignore invalid optional token
    }
    return true;
  }
}
