/*
 * Example of generating UUID-shaped strings.
 *
 * When to prefer Generators.uuid():
 *   - You need a deterministic, seedable identifier for tests / fixtures.
 *   - You want a string that LOOKS like an RFC 4122 v4 UUID without pulling
 *     in a crypto-grade UUID library or relying on `crypto.randomUUID()`.
 *
 * When NOT to use it:
 *   - For real production identifiers — use `crypto.randomUUID()` instead,
 *     which is backed by a CSPRNG.
 */

import { Generators } from '../src/index.js';

const ids = Generators.uuid().sampleN(5, { seed: 'uuid-example' });
for (const id of ids) {
  console.log('uuid:', id);
}
