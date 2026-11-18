import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { resendVerification } from '@/lib/auth/service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await parseBody(request, forgotPasswordSchema);
    try {
      await resendVerification(email, getClientIp(request));
    } catch (error) {
      if (error instanceof Error && error.name === 'RateLimitError') throw error;
      console.error('Resend verification failed:', error);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
