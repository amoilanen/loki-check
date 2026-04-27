# A property-based test

Demonstrates `forAll.assert` checking the classic
`reverse(reverse(xs)) === xs` property. Run with:

```sh
npx tsx examples/property-test.ts
```

## Source

<<< @/../examples/property-test.ts

## Notes

- `forAll.assert` throws on failure — perfect for dropping straight into a
  Vitest / Mocha / Jest test.
- The error message embeds the seed; copy it back into `{ seed: ... }` to
  reproduce the exact failing draw.
- Default shrinkers will trim the failing array to its smallest counter-example
  before reporting.
