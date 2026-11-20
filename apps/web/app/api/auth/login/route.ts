import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { logIn } from '@/lib/auth/service';
import { setSessionCookie } from '@/lib/auth/session';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { email, password, turnstileToken } = await parseBody(request, loginSchema);
    const clientIp = getClientIp(request);

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { detail: 'Verification check failed. Please refresh and try again.' },
        { status: 403 }
      );
    }

    const { user, csrfToken, sessionToken } = await logIn(
      email,
      password,
      clientIp
    );
    await setSessionCookie(sessionToken);
    return NextResponse.json({ user, csrfToken });
  } catch (error) {
    return errorResponse(error);
  }
}
