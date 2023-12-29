import { createHash } from 'node:crypto';

export function hashPassword(password: string, salt: string) {
  const hash = createHash('sha256');
  hash.update(password + salt);
  const hashedPassword = hash.digest('hex');
  return hashedPassword;
}
