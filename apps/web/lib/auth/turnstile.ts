/**
 * Verifies a Cloudflare Turnstile token with Cloudflare's siteverify API.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  ip?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In test environments or when secret key is unset, allow requests to proceed
  if (process.env.NODE_ENV === 'test' || !secretKey) {
    return true;
  }

  if (!token) {
    return false;
  }

  // Cloudflare's dummy test token that always passes (useful for testing)
  if (token === 'XXXX.DUMMY.TOKEN.XXXX') {
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip && ip !== 'unknown') {
      formData.append('remoteip', ip);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error(`[turnstile] Cloudflare siteverify error: status ${res.status}`);
      return false;
    }

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      console.warn('[turnstile] Verification failed:', data['error-codes']);
    }
    return Boolean(data.success);
  } catch (error) {
    console.error('[turnstile] Verification error:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('[turnstile] Allowing request in development despite network error.');
      return true;
    }
    return false;
  }
}

