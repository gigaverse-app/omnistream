import * as crypto from 'crypto';

export function generateId(prefix: string = ''): string {
  const randomBytes = crypto.randomBytes(16);
  const id = randomBytes.toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}
