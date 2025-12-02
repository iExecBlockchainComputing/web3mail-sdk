import { randomBytes, hexlify } from 'ethers';

export function generateSecureUniqueId(length) {
  return hexlify(randomBytes(length));
}
