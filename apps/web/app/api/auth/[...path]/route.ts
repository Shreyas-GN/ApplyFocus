import { getAuth } from '@/lib/auth/server';

type RouteContext = { params: Promise<{ path: string[] }> };

// Proxies browser auth calls (sign-in, sign-up, sign-out, password reset,
// session) to Neon Auth. The handler object is resolved lazily so the build
// does not require runtime secrets.
function handler() {
  return getAuth().handler();
}

export async function GET(request: Request, context: RouteContext) {
  return handler().GET(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handler().POST(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handler().PUT(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handler().DELETE(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handler().PATCH(request, context);
}
