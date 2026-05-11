/*
 * Example: idempotence and algebraic-law properties.
 *
 * Idempotence is one of the most reliable property-test patterns. Many
 * real-world functions are *meant* to be idempotent:
 *
 *   forall x. f(f(x)) === f(x)
 *
 * Examples: `Math.abs`, `String#trim`, `Array#sort`, `Set` construction,
 * deduping, normalisation, canonicalisation, schema validation. Stating
 * the law as a property gives you confidence the function actually
 * behaves the way the name advertises.
 *
 * This example also covers a related family of algebraic laws:
 *   - commutativity:  f(a, b) === f(b, a)
 *   - associativity:  f(f(a, b), c) === f(a, f(b, c))
 *   - identity:       f(a, e) === a
 *
 * Demonstrates:
 *   - multiple `forAll.assert` calls -- one per law
 *   - generating arrays of moderate length to exercise the under-test code
 *   - using a string seed per property for reproducibility
 */

import { forAll, Generators } from '../src/index.js';

function dedupe<T>(xs: readonly T[]): T[] {
  return [...new Set(xs)];
}

const intArrays = Generators.arrayOf(Generators.integer({ min: -50, max: 50 }), 30);
const ints = Generators.integer({ min: -1000, max: 1000 });

// Idempotence: deduping a deduped array changes nothing.
forAll.assert(
  intArrays,
  (xs) => {
    const a = dedupe(xs);
    const b = dedupe(a);
    return a.length === b.length && a.every((v, i) => v === b[i]);
  },
  { tries: 200, seed: 'idempotence-dedupe' },
);
console.log('idempotence: dedupe(dedupe(xs)) === dedupe(xs)');

// Idempotence: |abs(abs(x))| === |abs(x)|.
forAll.assert(
  ints,
  (x) => Math.abs(Math.abs(x)) === Math.abs(x),
  { tries: 200, seed: 'idempotence-abs' },
);
console.log('idempotence: abs(abs(x)) === abs(x)');

// Commutativity of addition.
forAll.assert(
  Generators.nTuple(ints, ints),
  ([a, b]) => a + b === b + a,
  { tries: 200, seed: 'commutativity-add' },
);
console.log('commutativity: a + b === b + a');

// Associativity of addition.
forAll.assert(
  Generators.nTuple(ints, ints, ints),
  ([a, b, c]) => (a + b) + c === a + (b + c),
  { tries: 200, seed: 'associativity-add' },
);
console.log('associativity: (a + b) + c === a + (b + c)');

// Identity element of addition.
forAll.assert(
  ints,
  (x) => x + 0 === x,
  { tries: 200, seed: 'identity-add-zero' },
);
console.log('identity: x + 0 === x');
