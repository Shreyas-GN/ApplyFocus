import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { logIn } from '@/lib/auth/service';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await parseBody(request, loginSchema);
    const { user, csrfToken, sessionToken } = await logIn(
      email,
      password,
      getClientIp(request)
    );
    await setSessionCookie(sessionToken);
    return NextResponse.json({ user, csrfToken });
  } catch (error) {
    return errorResponse(error);
  }
}
