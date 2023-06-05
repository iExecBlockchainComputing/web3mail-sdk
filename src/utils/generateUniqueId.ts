import crypto from 'crypto';

export function generateSecureUniqueId(length: number): string {
  const buffer = crypto.randomBytes(length);
  return buffer.toString('hex');
}
