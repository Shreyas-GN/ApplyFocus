import { getAuth } from '@/lib/auth/server';

type RouteContext = { params: Promise<{ path: string[] }> };
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Proxies browser auth calls (sign-in, sign-up, sign-out, password reset,
// session) to Neon Auth. The handler is resolved lazily so the build does not
// require runtime secrets, and configuration problems (missing env vars) are
// returned as a readable JSON error instead of an empty 500.
async function proxy(method: Method, request: Request, context: RouteContext) {
  try {
    return await getAuth().handler()[method](request, context);
  } catch (error) {
    console.error('[auth] Neon Auth proxy failed:', error);
    const message =
      error instanceof Error ? error.message : 'Authentication is unavailable.';
    return Response.json(
      { message, code: 'AUTH_CONFIGURATION_ERROR' },
      { status: 500 }
    );
  }
}

export const GET = (request: Request, context: RouteContext) =>
  proxy('GET', request, context);
export const POST = (request: Request, context: RouteContext) =>
  proxy('POST', request, context);
export const PUT = (request: Request, context: RouteContext) =>
  proxy('PUT', request, context);
export const DELETE = (request: Request, context: RouteContext) =>
  proxy('DELETE', request, context);
export const PATCH = (request: Request, context: RouteContext) =>
  proxy('PATCH', request, context);
