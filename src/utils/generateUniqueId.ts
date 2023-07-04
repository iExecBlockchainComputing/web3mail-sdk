import { randomBytes } from '@ethersproject/random';
import { hexlify } from '@ethersproject/bytes';

export function generateSecureUniqueId(length) {
  return hexlify(randomBytes(length));
}
