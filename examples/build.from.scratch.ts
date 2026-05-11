/*
 * Example: writing a generator from scratch using only the monadic primitives
 *   - pure(x)
 *   - map(f)
 *   - flatMap(f)
 *
 * Sometimes you reach for the abstract `Generator` class directly to talk to
 * the RNG. Most of the time you do NOT need to -- map / flatMap / pure
 * combined with the built-in combinators can express any pure generator.
 *
 * Here we build a "non-empty subset of an array" generator the long way and
 * the short way. Both produce the same values for the same seed.
 */

import {
  Generator,
  Generators,
  Maybe,
  Some,
  none,
  defaultRandom,
  type Random,
} from '../src/index.js';

const universe = ['apple', 'banana', 'cherry', 'date', 'elderberry'] as const;
type Fruit = (typeof universe)[number];

// -------- The long way: extend the Generator abstract class.
class NonEmptySubset extends Generator<Fruit[]> {
  generate(rng: Random = defaultRandom()): Maybe<Fruit[]> {
    if (universe.length === 0) return none;
    // Each element is included independently with probability 0.5.
    const out: Fruit[] = [];
    for (const v of universe) {
      if (rng.next() < 0.5) {
        out.push(v);
      }
    }
    if (out.length === 0) {
      // Ensure non-empty: always include at least the first element.
      out.push(universe[0] as Fruit);
    }
    return new Some(out);
  }
}

const longWay = new NonEmptySubset();

// -------- The short way: pure + flatMap + map.
//
// Pick a non-zero "mask" in [1, 2 ** n - 1], then derive the subset from the
// bits of the mask. No custom class, no RNG plumbing.
const totalMasks = (1 << universe.length) - 1;
const shortWay = Generators.integer({ min: 1, max: totalMasks }).map(mask => {
  const out: Fruit[] = [];
  for (let i = 0; i < universe.length; i++) {
    if ((mask & (1 << i)) !== 0) {
      out.push(universe[i] as Fruit);
    }
  }
  return out;
});

const long = longWay.sampleN(3, { seed: 'subset-1' });
const short = shortWay.sampleN(3, { seed: 'subset-2' });

console.log('hand-written generator:');
for (const x of long) console.log('  ', x);
console.log('built from map + integer:');
for (const x of short) console.log('  ', x);
