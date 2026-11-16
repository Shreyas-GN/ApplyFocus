import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { extCorsHeaders, extOptionsResponse } from '@/lib/server/ext-cors';
import {
  getExtensionAutofillPayload,
  verifyExtensionBearer,
} from '@/lib/server/extension';

export async function OPTIONS(request: NextRequest) {
  return extOptionsResponse(request.headers.get('origin'));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = extCorsHeaders(origin);

  const auth = await verifyExtensionBearer(request.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json(
      { detail: 'Invalid or revoked extension token' },
      { status: 401, headers }
    );
  }

  try {
    const [appUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);
    const payload = await getExtensionAutofillPayload(
      auth.userId,
      appUser?.email ?? null
    );
    return NextResponse.json(payload, { headers });
  } catch (error) {
    console.error('Failed to fetch extension profile payload:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500, headers }
    );
  }
}

