/*
 * Example of using forAll.assert as a property-based test entry point.
 *
 * Property: reversing a list twice yields the original list.
 *   forall xs. reverse(reverse(xs)) === xs
 */

import { Generators, forAll } from '../src/index.js';

function reverse<T>(xs: readonly T[]): T[] {
  return [...xs].reverse();
}

const intArrays = Generators.arrayOf(Generators.integer({ min: -1000, max: 1000 }), 50);

forAll.assert(
  intArrays,
  (xs) => {
    const round = reverse(reverse(xs));
    if (round.length !== xs.length) return false;
    for (let i = 0; i < xs.length; i++) {
      if (round[i] !== xs[i]) return false;
    }
    return true;
  },
  { tries: 200, seed: 'property-test-example' },
);

console.log('property holds: reverse(reverse(xs)) === xs');
