import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'node:path';
import config from '../utils/config.js';

class S3StorageService {
  constructor(opts = {}) {
    this.bucket =
      (opts && opts.bucketName) ||
      (config && config.s3 && config.s3.bucketName) ||
      process.env.S3_BUCKET_NAME ||
      process.env.AWS_BUCKET_NAME;

    this.region =
      (opts && opts.region) ||
      (config && config.s3 && config.s3.region) ||
      process.env.S3_REGION ||
      process.env.AWS_REGION;

    if (!this.bucket || !this.region) {
      throw new Error(
        'S3 bucket/region belum diset (S3_BUCKET_NAME & S3_REGION atau AWS_BUCKET_NAME & AWS_REGION)',
      );
    }

    const creds =
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined;

    this.s3 = new S3Client({ region: this.region, credentials: creds });
    this.publicReadAcl = Boolean(opts && opts.publicReadAcl);
    this.basePath = (opts && opts.basePath) || 'covers';
  }

  _safeName(str) {
    return String(str || '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-]+|[-]+$/g, '');
  }

  _extFromContentType(ct) {
    const map = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[String(ct || '').toLowerCase()] || 'bin';
  }

  buildKeyForAlbumCover(albumId, contentType) {
    const ext = this._extFromContentType(contentType);
    const safeId = this._safeName(albumId) || 'album';
    const fileName = `${safeId}-${Date.now()}.${ext}`;
    return path.posix.join(this.basePath, fileName);
  }

  _streamToBuffer(readable) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readable.on('data', (c) => chunks.push(c));
      readable.on('end', () => resolve(Buffer.concat(chunks)));
      readable.on('error', reject);
    });
  }

  async upload({ stream, contentType, key }) {
    if (!contentType) throw new Error('Content-Type tidak terdeteksi');

    const body = await this._streamToBuffer(stream);

    const input = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
    };
    if (this.publicReadAcl) input.ACL = 'public-read';

    try {
      await this.s3.send(new PutObjectCommand(input));
      return this.getPublicUrl(key);
    } catch (e) {
      console.error('S3 PutObject failed:', {
        name: e.name,
        message: e.message,
        http: e.$metadata && e.$metadata.httpStatusCode,
        bucket: this.bucket,
        region: this.region,
      });
      throw e;
    }
  }

  getPublicUrl(key) {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(
      key,
    )}`;
  }

  async delete(key) {
    if (!key) return;
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  extractKeyFromUrl(url) {
    try {
      const u = new URL(url);
      return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    } catch {
      return null;
    }
  }
}

export default S3StorageService;
