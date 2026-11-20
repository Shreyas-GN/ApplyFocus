// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createStorageClient } from './client';

const shouldRunR2Integration =
  process.env.RUN_R2_INTEGRATION === 'true' &&
  Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );

describe('Cloudflare R2 Storage Client', () => {
  it('instantiates storage client successfully', () => {
    const client = createStorageClient();
    expect(client.storage).toBeDefined();
    expect(client.storage.from).toBeDefined();
    const bucket = client.storage.from('applyfocus-resumes');
    expect(bucket.upload).toBeDefined();
    expect(bucket.download).toBeDefined();
    expect(bucket.remove).toBeDefined();
    expect(bucket.createSignedUrl).toBeDefined();
  });

  describe.skipIf(!shouldRunR2Integration)('Live R2 Integration', () => {
    const testKey = `test/integration_${Date.now()}.txt`;
    const testContent = 'Hello Cloudflare R2 from ApplyFocus!';
    const testBuffer = Buffer.from(testContent, 'utf-8');

    it('uploads, downloads, signs, and removes objects in R2', async () => {
      const client = createStorageClient();
      const storage = client.storage.from('applyfocus-resumes');

      // 1. Upload
      const { error: uploadError } = await storage.upload(testKey, testBuffer, {
        contentType: 'text/plain',
      });
      expect(uploadError).toBeNull();

      // 2. Download
      const { data: downloadBlob, error: downloadError } = await storage.download(testKey);
      expect(downloadError).toBeNull();
      expect(downloadBlob).not.toBeNull();
      const downloadedText = await downloadBlob!.text();
      expect(downloadedText).toBe(testContent);

      // 3. Create Presigned URL
      const { data: signData, error: signError } = await storage.createSignedUrl(testKey, 300);
      expect(signError).toBeNull();
      expect(signData?.signedUrl).toBeDefined();
      expect(signData!.signedUrl).toContain('r2.cloudflarestorage.com');

      // 4. Remove / Delete
      const { error: removeError } = await storage.remove([testKey]);
      expect(removeError).toBeNull();

      // 5. Verify gone
      const { error: checkError } = await storage.download(testKey);
      expect(checkError).not.toBeNull();
    });
  });
});
