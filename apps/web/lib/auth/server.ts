import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { stackServerApp } from './stack-server';

export interface AppUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

async function getOrCreateAppUser(
  stackAuthId: string,
  email: string,
  emailVerified: boolean
): Promise<AppUser> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.stackAuthId, stackAuthId))
    .limit(1);

  if (existing) {
    if (existing.email !== email) {
      await db
        .update(users)
        .set({ email })
        .where(eq(users.id, existing.id));
    }
    return {
      id: existing.id,
      email: existing.email,
      emailVerified,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const [created] = await db
    .insert(users)
    .values({ stackAuthId, email })
    .returning();

  if (!created) {
    throw new Error('Failed to provision app user record.');
  }

  return {
    id: created.id,
    email: created.email,
    emailVerified,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getUser(): Promise<AppUser | null> {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;

  try {
    return await getOrCreateAppUser(
      stackUser.id,
      stackUser.primaryEmail ?? '',
      stackUser.primaryEmailVerified ?? false
    );
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
