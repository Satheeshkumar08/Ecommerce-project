import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  key: string;
}

export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  originalFilename: string,
  mimetype: string
): Promise<UploadResult> => {
  // If no AWS keys or bucket configured (e.g. local test), fallback gracefully with clean URL
  const fileExtension = originalFilename.split('.').pop() || 'jpg';
  const fileKey = `products/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || env.AWS_ACCESS_KEY_ID.includes('placeholder')) {
    console.warn('[S3 Service] AWS credentials not configured. Returning Unsplash placeholder or mock URL.');
    return {
      key: fileKey,
      url: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80`,
    };
  }

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // Return CloudFront URL if configured, otherwise standard S3 virtual-hosted-style URL
  const publicUrl = env.CLOUDFRONT_URL
    ? `${env.CLOUDFRONT_URL.replace(/\/$/, '')}/${fileKey}`
    : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return {
    url: publicUrl,
    key: fileKey,
  };
};
