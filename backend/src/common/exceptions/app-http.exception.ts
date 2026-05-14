import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../errors/error-codes';

export class AppHttpException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ success: false, error: { code, message } }, status);
  }
}
