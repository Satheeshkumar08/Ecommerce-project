import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

const s3Config: any = {
  region: env.AWS_REGION,
};

// If explicit AWS credentials are provided in env, use them; otherwise SDK default credential chain (IAM Role / ECS Task Role)
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
}

export const s3Client = new S3Client(s3Config);
