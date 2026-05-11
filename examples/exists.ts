/*
 * Example: existential quantification with `exists`.
 *
 * `forAll` proves "no counter-example was found"; `exists` proves
 * "at least one witness was found". They are duals.
 *
 * `exists` is useful for:
 *   - Sanity-checking your *generator distribution*: does it actually
 *     produce values in the corner of the space you care about?
 *   - Showing reachability: "there exists an input that takes the parser
 *     down the error branch".
 *   - Documenting expected coverage in a checked-in way.
 *
 * Demonstrates:
 *   - exists(gen, p, { tries, seed }) and its `witness` field
 *   - using `exists` to assert that a generator can produce specific
 *     edge-case values
 */

import { exists, Generators } from '../src/index.js';

// 1. Witness search: find a triangle (a, b, c) with a^2 + b^2 = c^2.
//    Pythagorean triples are sparse -- we need a generous try budget.
const triple = Generators.nTuple(
  Generators.integer({ min: 1, max: 50 }),
  Generators.integer({ min: 1, max: 50 }),
  Generators.integer({ min: 1, max: 50 }),
);

const pythagorean = exists(
  triple,
  ([a, b, c]) => a * a + b * b === c * c,
  { tries: 5000, seed: 'exists-pythagorean' },
);

if (pythagorean.found) {
  console.log('pythagorean triple found:', pythagorean.witness, `after ${pythagorean.triesRun} tries`);
} else {
  console.log('no pythagorean triple in', pythagorean.triesRun, 'tries -- try a different seed');
}

// 2. Distribution check: confirm that an arrayOfLength(integer 0..10, 8)
//    generator can produce an array containing the value 0. This is the
//    kind of "coverage assertion" you might check in alongside the test
//    suite to make sure your generator actually reaches its corner cases.
const smallInts = Generators.integer({ min: 0, max: 10 });
const arr = Generators.arrayOfLength(smallInts, 8);
const containsZero = exists(
  arr,
  (xs) => xs.includes(0),
  { tries: 200, seed: 'exists-contains-zero' },
);
if (!containsZero.found) {
  throw new Error('arrays of length 8 from 0..10 should be able to contain 0');
}
console.log('generator can produce an array containing 0 -- witness:', containsZero.witness);
