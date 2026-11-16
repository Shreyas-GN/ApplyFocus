import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export interface AuthSessionUser {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
}

export async function getUser(): Promise<AuthSessionUser | null> {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      emailVerified: Boolean(session.user.emailVerified),
      createdAt: session.user.createdAt
        ? new Date(session.user.createdAt).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching auth session:', error);
    return null;
  }
}

export async function requireUser(): Promise<AuthSessionUser> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

