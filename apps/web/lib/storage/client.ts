import { createClient } from '@supabase/supabase-js';

/**
 * Server-only client for private résumé file storage (Supabase Storage).
 *
 * This is storage only — authentication is handled in-house
 * (see `lib/auth`). The service key bypasses storage policies, so every
 * caller must already have authorised the user and scoped the object key.
 */
export function createStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY is missing (needed for résumé file storage).'
    );
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
