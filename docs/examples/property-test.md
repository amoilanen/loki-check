# A property-based test

Demonstrates `forAll.assert` checking the classic *involution* property:
**`reverse(reverse(xs)) === xs`** for every array of integers. Run with:

```sh
npx tsx examples/property-test.ts
```

## Source

<<< @/../examples/property-test.ts

## Notes

- `forAll.assert` throws on failure, so it drops straight into a
  Vitest / Mocha / Jest / `node:test` block.
- The error message embeds the **seed**; copy it back into `{ seed: ... }`
  to reproduce the exact failing draw.
- Default shrinkers will trim the failing array to its smallest
  counter-example before reporting. For this property, no failure should
  ever occur: `reverse(reverse(xs))` is always `xs`.
- `tries: 200` doubles the default budget of 100. Tune this based on how
  "rare" you expect a counter-example to be: more tries means higher
  confidence, but proportionally more runtime.
- `seed: 'property-test-example'` is a **string seed**. Strings are hashed
  via `cyrb53` to derive the integer seed. Human-readable labels are much
  easier to copy around than 32-bit integers.

## See also

- [Sorted array example](./sorted-array.md): a richer property test with
  three composed invariants.
- [Custom shrinker example](./custom-shrinker.md): shows what happens
  when a property *does* fail.
- [Quantifiers guide](/guide/quantifiers): the full `forAll` / `exists`
  reference.
