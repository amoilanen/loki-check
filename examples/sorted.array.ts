/*
 * Example: property-based test for a real algorithm.
 *
 * Property: for every array of integers,
 *
 *   1. sorting preserves the length, and
 *   2. the sorted array is non-decreasing, and
 *   3. the sorted array is a permutation of the original (same multiset).
 *
 * This is the classic "sorted output" specification. It catches bugs like
 * "off-by-one in the index", "dropped element", "used wrong comparator".
 */

import { forAll, Generators } from '../src/index.js';

function sortAscending(xs: readonly number[]): number[] {
  return [...xs].sort((a, b) => a - b);
}

function isNonDecreasing(xs: readonly number[]): boolean {
  for (let i = 1; i < xs.length; i++) {
    if ((xs[i - 1] as number) > (xs[i] as number)) return false;
  }
  return true;
}

function asMultisetKey(xs: readonly number[]): string {
  return JSON.stringify([...xs].sort((a, b) => a - b));
}

const intArrays = Generators.arrayOf(Generators.integer({ min: -1000, max: 1000 }), 50);

forAll.assert(
  intArrays,
  xs => {
    const sorted = sortAscending(xs);
    return sorted.length === xs.length
        && isNonDecreasing(sorted)
        && asMultisetKey(sorted) === asMultisetKey(xs);
  },
  { tries: 200, seed: 'sorted-array-example' },
);

console.log('property holds: sortAscending preserves length, ordering, and multiset');
