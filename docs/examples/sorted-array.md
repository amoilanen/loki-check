# Property test for a sorting algorithm

Specifies the *behaviour* of an ascending sort with three classical
invariants, then drives the spec through `forAll.assert`. Run with:

```sh
npx tsx examples/sorted.array.ts
```

## Source

<<< @/../examples/sorted.array.ts

## Notes

- This is the **classical sorting specification**, used in every QuickCheck-
  family library since 1999:
  1. Length is preserved.
  2. Output is non-decreasing.
  3. Output is a permutation of the input (same multiset).
- The third invariant catches bugs the first two miss (e.g. "always returns
  `[0, 0, 0, ...]`" satisfies length + ordering but fails permutation).
- The `multiset` check is implemented as "stringified sorted array", which
  is cheap enough for `n = 50` and avoids pulling in a real multiset.
- With `tries: 200` and 50-element arrays you are exercising 10,000
  comparisons per run, yet the test stays sub-millisecond because the
  generators are tight.
