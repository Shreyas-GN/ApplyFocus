import { hash, verify } from '@node-rs/argon2';

// @node-rs/argon2 defaults to Argon2id.
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Burns the same CPU as a real verification so login timing does not reveal
 * whether an email is registered.
 */
export async function verifyDummyPassword(password: string): Promise<void> {
  dummyHash ??= hashPassword('dummy-password-for-timing-equalisation');
  await verifyPassword(await dummyHash, password);
}
