'use client';

import { createAuthClient } from '@neondatabase/auth/next';

/**
 * Browser-side Neon Auth client. Requests go to this app's own
 * `/api/auth/*` route, which proxies them to Neon Auth and manages the
 * session cookies.
 */
export const authClient = createAuthClient();
