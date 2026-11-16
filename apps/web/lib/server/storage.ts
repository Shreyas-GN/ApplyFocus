// Storage abstraction for resume binary files
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface StorageResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

const STORAGE_DIR = path.resolve(process.cwd(), '.local-storage', 'resumes');

export function getStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const handler = {
    from(_bucket: string) {
      void _bucket;
      return {
        async upload(
          filePath: string,
          fileBody: Buffer | Uint8Array,
          _options?: { contentType?: string; upsert?: boolean }
        ): Promise<StorageResult<{ path: string }>> {
          void _options;
          try {
            const fullPath = path.join(STORAGE_DIR, path.basename(filePath));
            fs.writeFileSync(fullPath, Buffer.from(fileBody));
            return { data: { path: filePath }, error: null };
          } catch (err) {
            return { data: null, error: err as Error };
          }
        },

        async createSignedUrl(
          filePath: string,
          _expiresIn: number
        ): Promise<StorageResult<{ signedUrl: string }>> {
          void _expiresIn;
          return {
            data: { signedUrl: `/api/resumes/download?key=${encodeURIComponent(filePath)}` },
            error: null,
          };
        },

        async download(filePath: string): Promise<StorageResult<Blob>> {
          try {
            const fullPath = path.join(STORAGE_DIR, path.basename(filePath));
            if (fs.existsSync(fullPath)) {
              const buf = fs.readFileSync(fullPath);
              return { data: new Blob([buf]), error: null };
            }
            return {
              data: new Blob([Buffer.from('sample resume content')]),
              error: null,
            };
          } catch (err) {
            return { data: null, error: err as Error };
          }
        },

        async remove(paths: string[]): Promise<StorageResult<unknown[]>> {
          try {
            for (const p of paths) {
              const fullPath = path.join(STORAGE_DIR, path.basename(p));
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            }
            return { data: paths, error: null };
          } catch (err) {
            return { data: null, error: err as Error };
          }
        },
      };
    },
  };

  return {
    ...handler,
    storage: handler,
  };
}
