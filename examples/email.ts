/*
 * Example: building an email-address generator from monadic primitives.
 *
 * Demonstrates:
 *   - flatMap for dependent draws (pick a number of atoms, then build them)
 *   - lift for applicative product (combine local + domain)
 *   - oneOfValues for finite alternatives (TLD)
 *
 * An email is `local @ domain`, where:
 *   - `local`  is 1–3 alphanumeric atoms joined by dots
 *   - `domain` is `host.tld` where the TLD is one of a known list
 */

import { Generators, type Generator } from '../src/index.js';

const atom: Generator<string> = Generators.stringOf(
  Generators.alphaNumChar(),
  { minLength: 1, maxLength: 8 },
);

// flatMap = monadic bind: pick the number of atoms first, then build them.
const local: Generator<string> = Generators.integer({ min: 1, max: 3 })
  .flatMap(n => Generators.arrayOfLength(atom, n).map(parts => parts.join('.')));

// lift = applicative: independently draw host and tld, then combine.
const domain: Generator<string> = Generators.lift(
  (host: string, tld: string) => `${host}.${tld}`,
  Generators.identifier(10),
  Generators.oneOfValues('com', 'net', 'org', 'dev', 'io'),
);

const email: Generator<string> = Generators.lift(
  (l: string, d: string) => `${l}@${d}`,
  local,
  domain,
);

const samples = email.sampleN(5, { seed: 'email-example' });
for (const e of samples) {
  console.log('email:', e);
}
