import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUser = { sub: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    return req.user as JwtUser;
  },
);
