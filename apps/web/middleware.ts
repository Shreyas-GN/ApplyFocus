import { type NextRequest } from 'next/server';
import { getAuth } from './lib/auth/server';

// Neon Auth guards the signed-in app pages: it validates (and refreshes) the
// session cookie and redirects visitors without a session to /login.
// Public pages (/, /login, /signup, /forgot-password, /reset-password,
// /verify-email, /terms, /privacy, ...) and all /api routes are deliberately
// excluded — API routes authenticate themselves via getUser() and the browser
// extension routes use bearer tokens.
export async function proxy(request: NextRequest) {
  return getAuth().middleware({ loginUrl: '/login' })(request);
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/copilot/:path*',
    '/jobs/:path*',
    '/onboarding/:path*',
    '/profile/:path*',
    '/resumes/:path*',
    '/settings/:path*',
    '/studio/:path*',
    '/tailor/:path*',
  ],
};
