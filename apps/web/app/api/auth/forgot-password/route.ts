import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { requestPasswordReset } from '@/lib/auth/service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await parseBody(request, forgotPasswordSchema);
    try {
      await requestPasswordReset(email, getClientIp(request));
    } catch (error) {
      // Only throttling is surfaced; delivery failures must not reveal
      // whether the account exists.
      if (error instanceof Error && error.name === 'RateLimitError') throw error;
      console.error('Password reset request failed:', error);
    }
    return NextResponse.json({
      ok: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
