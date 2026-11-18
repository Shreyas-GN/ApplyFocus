import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { resetPassword } from '@/lib/auth/service';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await parseBody(request, resetPasswordSchema);
    await resetPassword(token, password, getClientIp(request));
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
