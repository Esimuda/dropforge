import { HttpStatus, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { AppHttpException } from '../common/exceptions/app-http.exception';
import { ErrorCodes } from '../common/errors/error-codes';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('CLOUDINARY_URL');
    if (url) {
      try {
        cloudinary.config(true);
      } catch {
        // ignore invalid cloudinary config in dev
      }
    }
  }

  validateImage(file: { mimetype?: string; originalname?: string; size?: number; buffer?: Buffer }): void {
    const size = file.size ?? file.buffer?.length ?? 0;
    if (size <= 0) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'Empty file.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (size > MAX_BYTES) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'File too large. Max size is 5MB.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    const ext = (file.originalname ?? '').split('.').pop()?.toLowerCase() ?? '';
    const mimeOk = ALLOWED_MIME.has(mime);
    const extOk = ALLOWED_EXT.has(ext);
    if (!mimeOk && !extOk) {
      throw new AppHttpException(
        ErrorCodes.BAD_REQUEST,
        'Only JPG, PNG, WEBP, or GIF images are allowed.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    filename: string,
  ): Promise<string | null> {
    if (!this.config.get<string>('CLOUDINARY_URL')) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: filename, resource_type: 'image' },
        (err, result) => {
          if (err || !result?.secure_url) {
            return reject(err || new Error('Upload failed'));
          }
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  async uploadImageFile(
    file: Express.Multer.File,
    folder: string,
    filename: string,
  ): Promise<string | null> {
    this.validateImage(file);
    return this.uploadBuffer(file.buffer, folder, filename);
  }
}
