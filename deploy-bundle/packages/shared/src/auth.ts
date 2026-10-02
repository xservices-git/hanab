import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}
