import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@applypilot/validators';
import { errorResponse, getClientIp, parseBody } from '@/lib/auth/request';
import { signUp } from '@/lib/auth/service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await parseBody(request, registerSchema);
    await signUp(email, password, getClientIp(request));
    // No session yet: the account is activated by the emailed link.
    return NextResponse.json({ requiresEmailConfirmation: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
