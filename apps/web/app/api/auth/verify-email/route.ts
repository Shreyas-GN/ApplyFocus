import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@applypilot/validators';
import { errorResponse, parseBody } from '@/lib/auth/request';
import { verifyEmail } from '@/lib/auth/service';
import { setSessionCookie } from '@/lib/auth/session';

// POST (not GET) so link-preview scanners cannot burn the one-time token.
export async function POST(request: NextRequest) {
  try {
    const { token } = await parseBody(request, verifyEmailSchema);
    const { user, csrfToken, sessionToken } = await verifyEmail(token);
    await setSessionCookie(sessionToken);
    return NextResponse.json({ user, csrfToken });
  } catch (error) {
    return errorResponse(error);
  }
}
