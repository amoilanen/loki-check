/*
 * Example of generating a UK-style phone number using string templating.
 *
 * Demonstrates:
 *   - concat(...) to glue several string generators together
 *   - numericString / stringOf with bounded length
 *   - pure(...) to inject literal separators
 */

import { Generators } from '../src/index.js';

const phone = Generators.concat(
  Generators.pure('+44 '),
  Generators.numericString({ minLength: 4, maxLength: 4 }),
  Generators.pure(' '),
  Generators.stringOf(Generators.numChar(), { minLength: 6, maxLength: 6 }),
);

const numbers = phone.sampleN(3, { seed: 'phone-example' });
for (const n of numbers) {
  console.log('phone:', n);
}
