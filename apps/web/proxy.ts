import { NextResponse, type NextRequest } from 'next/server';
import {
  CSRF_EXEMPT_PREFIXES,
  CSRF_HEADER,
  SESSION_COOKIE,
} from './lib/auth/constants';
import { verifyCsrfToken } from './lib/auth/csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function forbidden(detail: string) {
  return NextResponse.json({ detail }, { status: 403 });
}

// Next 16 `proxy` file convention (formerly middleware). Two jobs:
//  1. Signed-in app pages: redirect visitors without a session cookie to
//     /login. (Only presence is checked here — the real lookup needs the
//     database, which middleware cannot reach; getUser()/ProtectedRoute
//     validate the session.)
//  2. API CSRF defence for cookie-authenticated mutations: same-origin check
//     plus the X-CSRF-Token header derived from the session cookie.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith('/api/')) {
    if (SAFE_METHODS.has(request.method)) return NextResponse.next();
    if (CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }

    const origin = request.headers.get('origin');
    if (origin) {
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        // malformed origin -> rejected below
      }
      if (originHost !== request.headers.get('host')) {
        return forbidden('Cross-origin request blocked.');
      }
    }

    // No cookie means no ambient credential to abuse; the route itself
    // answers 401 for anything that needs a user.
    if (!sessionToken) return NextResponse.next();

    const ok = await verifyCsrfToken(sessionToken, request.headers.get(CSRF_HEADER));
    if (!ok) return forbidden('Invalid or missing CSRF token');
    return NextResponse.next();
  }

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
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
