import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppHttpException } from '../exceptions/app-http.exception';
import { ErrorCodes } from '../errors/error-codes';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: { sub: string } }>();
    const userId = req.user?.sub;
    if (!userId) {
      throw new AppHttpException(ErrorCodes.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const project = await this.prisma.project.findUnique({
      where: { ownerId: userId },
    });
    if (!project || !project.isVerified) {
      throw new AppHttpException(
        ErrorCodes.FORBIDDEN,
        'Only verified project owners can access this resource.',
        HttpStatus.FORBIDDEN,
      );
    }
    (req as { project?: { id: string } }).project = project;
    return true;
  }
}
