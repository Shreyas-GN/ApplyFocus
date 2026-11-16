import { auth } from '@/lib/auth/server';
import { type NextRequest } from 'next/server';

const authMiddleware = auth.middleware({
  loginUrl: '/login',
  publicRoutes: [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/privacy',
    '/terms',
    '/api/auth',
    '/api/cron',
  ],
});

export async function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
