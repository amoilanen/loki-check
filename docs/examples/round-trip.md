# Round-trip property

A very valuable property-based testing pattern. State the law:

> `decode(encode(x)) === x`

...and you cover an enormous class of bugs in any serialiser, parser, or codec:
missing fields, type confusion, encoding mismatches, lossy serialisation,
silent truncation, escaping bugs. Run with:

```sh
npx tsx examples/round.trip.ts
```

## Source

<<< @/../examples/round.trip.ts

## Notes

- `forAll.assert` is the right entry point inside a test runner: it throws
  with a seed-embedded message on failure, which is exactly what
  Vitest / Mocha / Jest / `node:test` want.
- **Pin the input generator to the codec's actual domain.** Here, an
  integer in ±1,000,000. If you pass `Generators.float()` you would
  immediately discover that the simple comma-separated format does not
  round-trip floating-point precision (possibly a real bug, possibly an
  out-of-scope corner case for your codec).
- Round-trip properties are *symmetric*. Whenever you have a `decode`,
  consider also testing `encode(decode(s)) === s` for the subset of `s`
  your decoder is meant to accept.

Where to look for round-trip laws: anywhere you have two functions whose
names suggest inverses: `parse` / `format`, `serialize` / `deserialize`,
`encode` / `decode`, `marshal` / `unmarshal`, `toJSON` / `fromJSON`,
`pack` / `unpack`, `compress` / `decompress`.

## See also

- [Property test example](./property-test.md): a simpler `forAll.assert`
  example (involution: `reverse(reverse(xs)) === xs`).
- [Idempotence example](./idempotence.md): another family of
  algebraic-law properties.
