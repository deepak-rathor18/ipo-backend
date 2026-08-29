import crypto from 'crypto';

/**
 * Compares two strings in constant time to prevent timing attacks when
 * checking submitted auth codes against the configured secret codes.
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  // timingSafeEqual requires equal-length buffers. If lengths differ we
  // still perform a dummy comparison against a same-length buffer so the
  // response time doesn't leak length information, then return false.
  if (bufA.length !== bufB.length) {
    const padded = Buffer.alloc(bufA.length);
    crypto.timingSafeEqual(bufA, padded);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
