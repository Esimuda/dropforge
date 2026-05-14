import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppHttpException } from '../exceptions/app-http.exception';
import { ErrorCodes } from '../errors/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof AppHttpException) {
      const body = exception.getResponse() as Record<string, unknown>;
      return res.status(exception.getStatus()).json(body);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();
      let message =
        typeof exResponse === 'string'
          ? exResponse
          : (exResponse as { message?: string | string[] })?.message;
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
      if (!message) {
        message = exception.message;
      }
      const code =
        status === HttpStatus.UNAUTHORIZED
          ? ErrorCodes.UNAUTHORIZED
          : status === HttpStatus.FORBIDDEN
            ? ErrorCodes.FORBIDDEN
            : status === HttpStatus.NOT_FOUND
              ? ErrorCodes.NOT_FOUND
              : ErrorCodes.BAD_REQUEST;
      return res.status(status).json({
        success: false,
        error: { code, message: String(message) },
      });
    }

    this.logger.error(exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
}
