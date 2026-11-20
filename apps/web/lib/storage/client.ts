import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let cachedClient: S3Client | null = null;

function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2_ENDPOINT, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY is missing (needed for résumé file storage).'
    );
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedClient;
}

export interface StorageBucketClient {
  upload(
    path: string,
    fileBody: Buffer | Uint8Array,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ error: Error | null }>;

  download(
    path: string
  ): Promise<{ data: Blob | null; error: Error | null }>;

  remove(
    paths: string[]
  ): Promise<{ error: Error | null }>;

  createSignedUrl(
    path: string,
    expiresIn: number
  ): Promise<{ data: { signedUrl: string } | null; error: Error | null }>;
}

/**
 * Server-only client for private résumé file storage on Cloudflare R2 (S3-compatible).
 *
 * Keeps a familiar interface (`createStorageClient().storage.from('resumes')`)
 * so existing callers continue to work seamlessly.
 */
export function createStorageClient() {
  const s3 = getS3Client();
  const defaultBucket = process.env.R2_BUCKET_NAME || 'applyfocus-resumes';

  return {
    storage: {
      from(bucketName: string = defaultBucket): StorageBucketClient {
        const bucket = process.env.R2_BUCKET_NAME || bucketName;

        return {
          async upload(path: string, fileBody: Buffer | Uint8Array, options?: { contentType?: string }) {
            try {
              const command = new PutObjectCommand({
                Bucket: bucket,
                Key: path,
                Body: fileBody,
                ContentType: options?.contentType || 'application/octet-stream',
              });
              await s3.send(command);
              return { error: null };
            } catch (err) {
              return { error: err instanceof Error ? err : new Error(String(err)) };
            }
          },

          async download(path: string) {
            try {
              const command = new GetObjectCommand({
                Bucket: bucket,
                Key: path,
              });
              const response = await s3.send(command);
              if (!response.Body) {
                return { data: null, error: new Error('Empty response body from storage.') };
              }
              const bytes = await response.Body.transformToByteArray();
              const blob = new Blob([Buffer.from(bytes)], {
                type: response.ContentType || 'application/octet-stream',
              });
              return { data: blob, error: null };
            } catch (err) {
              return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
            }
          },

          async remove(paths: string[]) {
            try {
              if (paths.length === 0) return { error: null };

              if (paths.length === 1) {
                await s3.send(
                  new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: paths[0],
                  })
                );
              } else {
                await s3.send(
                  new DeleteObjectsCommand({
                    Bucket: bucket,
                    Delete: {
                      Objects: paths.map((k) => ({ Key: k })),
                    },
                  })
                );
              }
              return { error: null };
            } catch (err) {
              return { error: err instanceof Error ? err : new Error(String(err)) };
            }
          },

          async createSignedUrl(path: string, expiresIn: number) {
            try {
              const command = new GetObjectCommand({
                Bucket: bucket,
                Key: path,
              });
              const signedUrl = await getSignedUrl(s3, command, { expiresIn });
              return { data: { signedUrl }, error: null };
            } catch (err) {
              return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
            }
          },
        };
      },
    },
  };
}
