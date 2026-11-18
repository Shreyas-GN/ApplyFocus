import { redirect } from 'next/navigation';
import { getAuth } from './server';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

/**
 * Returns the signed-in user for the current request (Neon Auth session
 * cookie), or null when there is no valid session.
 */
export async function getUser(): Promise<SessionUser | null> {
  try {
    const { data, error } = await getAuth().getSession();
    if (error || !data?.user) return null;

    const { id, email, emailVerified, name } = data.user;
    return {
      id,
      email: email ?? '',
      emailVerified: Boolean(emailVerified),
      name: name ?? null,
    };
  } catch (error) {
    console.error('Failed to resolve Neon Auth session:', error);
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
