import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { signUp } from '@/lib/auth/service';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await parseBody(request, registerSchema);
    const { user, csrfToken, sessionToken, emailSent } = await signUp(
      email,
      password,
      getClientIp(request)
    );
    await setSessionCookie(sessionToken);
    return NextResponse.json({ user, csrfToken, emailSent }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
