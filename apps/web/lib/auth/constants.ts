export const SESSION_COOKIE = 'session_id';
export const CSRF_HEADER = 'x-csrf-token';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const PASSWORD_RESET_TTL_SECONDS = 60 * 60; // 1 hour
export const EMAIL_VERIFICATION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Mutating /api requests to these prefixes skip the CSRF header check:
// they either run before a session exists, or authenticate without cookies.
export const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/ext/', // browser extension: bearer token
  '/api/cron/', // Vercel cron: CRON_SECRET
];
