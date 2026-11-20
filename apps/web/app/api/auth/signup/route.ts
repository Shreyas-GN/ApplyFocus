import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { signUp } from '@/lib/auth/service';
import { setSessionCookie } from '@/lib/auth/session';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { email, password, turnstileToken } = await parseBody(request, registerSchema);
    const clientIp = getClientIp(request);

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { detail: 'Verification check failed. Please refresh and try again.' },
        { status: 403 }
      );
    }

    const { session } = await signUp(email, password, clientIp);
    if (session) {
      await setSessionCookie(session.sessionToken);
      return NextResponse.json(
        {
          user: session.user,
          csrfToken: session.csrfToken,
          requiresEmailConfirmation: false,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { requiresEmailConfirmation: false },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
