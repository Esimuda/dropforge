import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

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
        { folder, public_id: filename, resource_type: 'auto' },
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
}
